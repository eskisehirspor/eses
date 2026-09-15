'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  CATALOG_FIXTURES,
  CATALOG_PLAYERS,
  CATALOG_STANDINGS,
  CATALOG_TEAMS,
  CATALOG_VENUE,
  FOOTBALL_CATALOG_META,
  canCorrectLiveMatch,
  canOperateLiveMatch,
  catalogKickoffIso,
} from '@eskisehirspor/shared';
import { syncCatalogCrests } from '@/lib/matches/crests';
import { getSessionRoles } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { toAdminErrorMessage } from '@/lib/errors';
import { logger } from '@/lib/logger';

async function requireOps() {
  const session = await getSessionRoles();
  if (!session.userId || !canOperateLiveMatch(session.roles)) {
    redirect('/unauthorized');
  }
  return session;
}

async function requireSuperAdmin() {
  const session = await getSessionRoles();
  if (!session.userId || !canCorrectLiveMatch(session.roles)) {
    redirect('/unauthorized');
  }
  return session;
}

function formString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? '').trim();
  return value.length > 0 ? value : null;
}

function formInt(formData: FormData, key: string) {
  const raw = formString(formData, key);
  if (!raw) {
    return null;
  }
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : null;
}

function requestId() {
  return crypto.randomUUID();
}

function rpcRedirect(fixtureId: string, error: { message: string; code?: string } | null) {
  logger.error('Canlı maç işlemi', { code: error?.code ?? 'live.rpc', cause: error?.message ?? 'unknown' });
  redirect(`/console/matches/${fixtureId}?error=${encodeURIComponent(toAdminErrorMessage(error))}`);
}

export async function importOfficialCatalog() {
  await requireOps();
  const supabase = await createSupabaseServerClient();

  const { data: existingCompetition } = await supabase
    .from('competitions')
    .select('id')
    .eq('provider_code', FOOTBALL_CATALOG_META.providerCode)
    .eq('provider_competition_id', FOOTBALL_CATALOG_META.providerCompetitionId)
    .maybeSingle();

  let competitionId = existingCompetition?.id;
  if (!competitionId) {
    const { data: competition, error: competitionError } = await supabase
      .from('competitions')
      .insert({
        name: FOOTBALL_CATALOG_META.competitionName,
        season_label: FOOTBALL_CATALOG_META.seasonLabel,
        is_active: true,
        provider_code: FOOTBALL_CATALOG_META.providerCode,
        provider_competition_id: FOOTBALL_CATALOG_META.providerCompetitionId,
      })
      .select('id')
      .single();
    if (competitionError || !competition) {
      logger.error('Lig yazılamadı', { code: 'catalog.competition', cause: competitionError?.message ?? 'missing' });
      redirect(`/console/matches?error=${encodeURIComponent(toAdminErrorMessage(competitionError))}`);
    }
    competitionId = competition.id;
  }

  const { data: venue, error: venueError } = await supabase
    .from('venues')
    .insert({ name: CATALOG_VENUE.name, city: CATALOG_VENUE.city })
    .select('id')
    .maybeSingle();
  if (venueError) {
    const { data: existingVenue } = await supabase
      .from('venues')
      .select('id')
      .eq('name', CATALOG_VENUE.name)
      .maybeSingle();
    if (!existingVenue) {
      logger.error('Stadyum yazılamadı', { code: 'catalog.venue', cause: venueError.message });
      redirect(`/console/matches?error=${encodeURIComponent(toAdminErrorMessage(venueError))}`);
    }
  }

  const venueId = venue?.id
    ?? (
      await supabase.from('venues').select('id').eq('name', CATALOG_VENUE.name).maybeSingle()
    ).data?.id
    ?? null;

  const teamIds = new Map<string, string>();
  for (const team of CATALOG_TEAMS) {
    const { data, error } = await supabase
      .from('teams')
      .upsert(
        {
          name: team.name,
          short_name: team.shortName,
          slug: team.slug,
          is_eskisehirspor: Boolean(team.isEskisehirspor),
          provider_code: FOOTBALL_CATALOG_META.providerCode,
          provider_team_id: team.providerTeamId,
        },
        { onConflict: 'slug' },
      )
      .select('id, slug')
      .single();
    if (error || !data) {
      logger.error('Takım yazılamadı', { code: 'catalog.team', cause: error?.message ?? team.slug });
      redirect(`/console/matches?error=${encodeURIComponent(toAdminErrorMessage(error))}`);
    }
    teamIds.set(data.slug, data.id);
  }

  await syncCatalogCrests(supabase, teamIds);

  const clubId = teamIds.get('eskisehirspor');
  if (!clubId) {
    redirect('/console/matches?error=' + encodeURIComponent('Eskişehirspor kaydı yok.'));
    return;
  }

  for (const player of CATALOG_PLAYERS) {
    const providerPlayerId = `eskisehirspor:${player.displayName}`;
    const { data: existingPlayer } = await supabase
      .from('players')
      .select('id')
      .eq('provider_code', 'manual')
      .eq('provider_player_id', providerPlayerId)
      .maybeSingle();
    if (existingPlayer) {
      continue;
    }
    const { error } = await supabase.from('players').insert({
      team_id: clubId,
      display_name: player.displayName,
      first_name: player.firstName,
      last_name: player.lastName,
      shirt_number: player.shirtNumber,
      position: player.position,
      is_active: true,
      source_url: 'https://www.eskisehirspor.org.tr/a-takim',
      provider_code: 'manual',
      provider_player_id: providerPlayerId,
    });
    if (error) {
      logger.error('Oyuncu yazılamadı', { code: 'catalog.player', cause: error.message });
    }
  }

  const { data: staleFixtures, error: staleError } = await supabase
    .from('fixtures')
    .select('id, status, provider_fixture_id')
    .eq('competition_id', competitionId);
  if (staleError) {
    logger.error('Eski fikstür okunamadı', { code: 'catalog.fixtures.read', cause: staleError.message });
    redirect(`/console/matches?error=${encodeURIComponent(toAdminErrorMessage(staleError))}`);
  }
  const catalogIds = new Set(CATALOG_FIXTURES.map((fixture) => fixture.providerFixtureId));
  for (const row of staleFixtures ?? []) {
    if (row.status === 'live' || row.status === 'halftime') {
      continue;
    }
    if (catalogIds.has(row.provider_fixture_id)) {
      continue;
    }
    const { error: deleteError } = await supabase.from('fixtures').delete().eq('id', row.id);
    if (deleteError) {
      logger.error('Eski maç silinemedi', { code: 'catalog.fixture.delete', cause: deleteError.message });
    }
  }

  for (const fixture of CATALOG_FIXTURES) {
    const homeId = teamIds.get(fixture.homeSlug);
    const awayId = teamIds.get(fixture.awaySlug);
    if (!homeId || !awayId) {
      continue;
    }
    const kickoff = catalogKickoffIso(fixture.date, fixture.kickoffTime);
    const isHome = fixture.homeSlug === 'eskisehirspor';
    const payload = {
      competition_id: competitionId,
      venue_id: isHome ? venueId : null,
      home_team_id: homeId,
      away_team_id: awayId,
      kickoff_at: kickoff,
      status: fixture.status,
      round_label: fixture.roundLabel,
      home_score: fixture.homeScore,
      away_score: fixture.awayScore,
      provider_code: FOOTBALL_CATALOG_META.providerCode,
      provider_fixture_id: fixture.providerFixtureId,
      live_source: 'manual' as const,
    };
    const { data: existingFixture } = await supabase
      .from('fixtures')
      .select('id, status')
      .eq('provider_code', FOOTBALL_CATALOG_META.providerCode)
      .eq('provider_fixture_id', fixture.providerFixtureId)
      .maybeSingle();
    if (existingFixture?.status === 'live' || existingFixture?.status === 'halftime') {
      continue;
    }
    if (existingFixture) {
      const { error } = await supabase.from('fixtures').delete().eq('id', existingFixture.id);
      if (error) {
        logger.error('Maç yenilenemedi', { code: 'catalog.fixture.replace', cause: error.message });
        continue;
      }
    }
    const { error } = await supabase.from('fixtures').insert(payload);
    if (error) {
      logger.error('Maç yazılamadı', { code: 'catalog.fixture', cause: error.message });
    }
  }

  const { error: clearStandingsError } = await supabase.from('standings').delete().eq('competition_id', competitionId);
  if (clearStandingsError) {
    logger.error('Puan durumu temizlenemedi', { code: 'catalog.standing.clear', cause: clearStandingsError.message });
  }

  for (const standing of CATALOG_STANDINGS) {
    const teamId = teamIds.get(standing.slug);
    if (!teamId) {
      continue;
    }
    const { error } = await supabase.from('standings').insert({
      competition_id: competitionId,
      team_id: teamId,
      position: standing.position,
      played: standing.played,
      wins: standing.wins,
      draws: standing.draws,
      losses: standing.losses,
      goals_for: standing.goalsFor,
      goals_against: standing.goalsAgainst,
      points: standing.points,
    });
    if (error) {
      logger.error('Puan durumu yazılamadı', { code: 'catalog.standing', cause: error.message });
    }
  }

  revalidatePath('/console/matches');
  redirect('/console/matches?imported=1');
}

export async function startMatchAction(formData: FormData) {
  await requireOps();
  const fixtureId = formString(formData, 'fixture_id');
  if (!fixtureId) {
    redirect('/console/matches?error=' + encodeURIComponent('Maç yok.'));
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('live_start_match', {
    p_fixture_id: fixtureId,
    p_client_request_id: requestId(),
  });
  if (error) {
    rpcRedirect(fixtureId, error);
  }
  revalidatePath(`/console/matches/${fixtureId}`);
  redirect(`/console/matches/${fixtureId}`);
}

export async function prepareMatchAction(formData: FormData) {
  await requireOps();
  const fixtureId = formString(formData, 'fixture_id');
  if (!fixtureId) {
    redirect('/console/matches');
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('live_prepare_match', {
    p_fixture_id: fixtureId,
    p_client_request_id: requestId(),
  });
  if (error) {
    rpcRedirect(fixtureId, error);
  }
  revalidatePath(`/console/matches/${fixtureId}`);
  redirect(`/console/matches/${fixtureId}`);
}

export async function addGoalAction(formData: FormData) {
  await requireOps();
  const fixtureId = formString(formData, 'fixture_id')!;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('live_add_goal', {
    p_fixture_id: fixtureId,
    p_team_id: formString(formData, 'team_id'),
    p_player_id: formString(formData, 'player_id'),
    p_minute: formInt(formData, 'minute'),
    p_extra_minute: formInt(formData, 'extra_minute'),
    p_client_request_id: requestId(),
  });
  if (error) {
    rpcRedirect(fixtureId, error);
  }
  revalidatePath(`/console/matches/${fixtureId}`);
  redirect(`/console/matches/${fixtureId}`);
}

export async function addCardAction(formData: FormData) {
  await requireOps();
  const fixtureId = formString(formData, 'fixture_id')!;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('live_add_card', {
    p_fixture_id: fixtureId,
    p_team_id: formString(formData, 'team_id'),
    p_player_id: formString(formData, 'player_id'),
    p_card_type: formString(formData, 'card_type'),
    p_minute: formInt(formData, 'minute'),
    p_extra_minute: formInt(formData, 'extra_minute'),
    p_client_request_id: requestId(),
  });
  if (error) {
    rpcRedirect(fixtureId, error);
  }
  revalidatePath(`/console/matches/${fixtureId}`);
  redirect(`/console/matches/${fixtureId}`);
}

export async function addSubstitutionAction(formData: FormData) {
  await requireOps();
  const fixtureId = formString(formData, 'fixture_id')!;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('live_add_substitution', {
    p_fixture_id: fixtureId,
    p_team_id: formString(formData, 'team_id'),
    p_player_out_id: formString(formData, 'player_out_id'),
    p_player_in_id: formString(formData, 'player_in_id'),
    p_minute: formInt(formData, 'minute'),
    p_extra_minute: formInt(formData, 'extra_minute'),
    p_client_request_id: requestId(),
  });
  if (error) {
    rpcRedirect(fixtureId, error);
  }
  revalidatePath(`/console/matches/${fixtureId}`);
  redirect(`/console/matches/${fixtureId}`);
}

export async function setHalftimeAction(formData: FormData) {
  await requireOps();
  const fixtureId = formString(formData, 'fixture_id')!;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('live_set_halftime', {
    p_fixture_id: fixtureId,
    p_client_request_id: requestId(),
  });
  if (error) {
    rpcRedirect(fixtureId, error);
  }
  revalidatePath(`/console/matches/${fixtureId}`);
  redirect(`/console/matches/${fixtureId}`);
}

export async function startSecondHalfAction(formData: FormData) {
  await requireOps();
  const fixtureId = formString(formData, 'fixture_id')!;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('live_start_second_half', {
    p_fixture_id: fixtureId,
    p_client_request_id: requestId(),
  });
  if (error) {
    rpcRedirect(fixtureId, error);
  }
  revalidatePath(`/console/matches/${fixtureId}`);
  redirect(`/console/matches/${fixtureId}`);
}

export async function finishMatchAction(formData: FormData) {
  await requireOps();
  const fixtureId = formString(formData, 'fixture_id')!;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('live_finish_match', {
    p_fixture_id: fixtureId,
    p_client_request_id: requestId(),
  });
  if (error) {
    rpcRedirect(fixtureId, error);
  }
  revalidatePath(`/console/matches/${fixtureId}`);
  redirect(`/console/matches/${fixtureId}`);
}

export async function reverseEventAction(formData: FormData) {
  await requireSuperAdmin();
  const fixtureId = formString(formData, 'fixture_id')!;
  const eventId = formString(formData, 'event_id');
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('live_reverse_event', {
    p_event_id: eventId,
    p_client_request_id: requestId(),
  });
  if (error) {
    rpcRedirect(fixtureId, error);
  }
  revalidatePath(`/console/matches/${fixtureId}`);
  redirect(`/console/matches/${fixtureId}`);
}
