import type { FixtureStatus, MatchEventType } from '@eskisehirspor/shared';
import { TEAM_CRESTS_BUCKET } from '@eskisehirspor/shared';
import { getSupabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { resolvePreferredOrRemoteCrestUri } from './crest-uri';

export type TeamSummary = {
  id: string;
  name: string;
  short_name: string;
  slug: string;
  is_eskisehirspor: boolean;
  crest_path: string | null;
};

export type FixtureRecord = {
  id: string;
  kickoff_at: string;
  status: FixtureStatus;
  round_label: string | null;
  home_score: number | null;
  away_score: number | null;
  started_at: string | null;
  second_half_started_at: string | null;
  ended_at: string | null;
  live_updated_at: string | null;
  home_team: TeamSummary;
  away_team: TeamSummary;
  competition: { id: string; name: string; season_label: string };
  venue: { id: string; name: string; city: string | null } | null;
};

export type MatchEventRecord = {
  id: string;
  fixture_id: string;
  minute: number | null;
  extra_minute: number | null;
  event_type: MatchEventType | string;
  team_id: string | null;
  player_id: string | null;
  related_player_id: string | null;
  reversed_at: string | null;
  sort_key: number;
};

export type StandingRecord = {
  position: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  team: TeamSummary;
};

function requireClient() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('not_configured');
  }
  return client;
}

const fixtureSelect =
  'id, kickoff_at, status, round_label, home_score, away_score, started_at, second_half_started_at, ended_at, live_updated_at, home_team:teams!home_team_id(id, name, short_name, slug, is_eskisehirspor, crest_path), away_team:teams!away_team_id(id, name, short_name, slug, is_eskisehirspor, crest_path), competition:competitions!competition_id(id, name, season_label), venue:venues!venue_id(id, name, city)';

/**
 * Prefer live preferred PNG URL by slug; else https; else storage public URL.
 * Previously https paths were incorrectly discarded (always null).
 */
export function resolveCrestDisplayUri(input: {
  slug: string;
  isClub: boolean;
  crestPath: string | null;
}): string | null {
  const preferredOrRemote = resolvePreferredOrRemoteCrestUri(input);
  if (preferredOrRemote) {
    return preferredOrRemote;
  }
  if (input.isClub || !input.crestPath) {
    return null;
  }
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }
  const publicUrl = client.storage.from(TEAM_CRESTS_BUCKET).getPublicUrl(input.crestPath).data.publicUrl;
  return `${publicUrl}${publicUrl.includes('?') ? '&' : '?'}v=png2`;
}

function asTeam(value: TeamSummary | TeamSummary[] | null): TeamSummary {
  const team = Array.isArray(value) ? value[0] : value;
  if (!team) {
    throw new Error('missing_team');
  }
  const slug = team.slug ?? '';
  const isClub = Boolean(team.is_eskisehirspor);
  return {
    id: team.id,
    name: team.name,
    short_name: team.short_name,
    slug,
    is_eskisehirspor: isClub,
    crest_path: resolveCrestDisplayUri({
      slug,
      isClub,
      crestPath: team.crest_path ?? null,
    }),
  };
}

function mapFixture(row: Record<string, unknown>): FixtureRecord {
  return {
    id: String(row.id),
    kickoff_at: String(row.kickoff_at),
    status: row.status as FixtureStatus,
    round_label: (row.round_label as string | null) ?? null,
    home_score: (row.home_score as number | null) ?? null,
    away_score: (row.away_score as number | null) ?? null,
    started_at: (row.started_at as string | null) ?? null,
    second_half_started_at: (row.second_half_started_at as string | null) ?? null,
    ended_at: (row.ended_at as string | null) ?? null,
    live_updated_at: (row.live_updated_at as string | null) ?? null,
    home_team: asTeam(row.home_team as TeamSummary | TeamSummary[] | null),
    away_team: asTeam(row.away_team as TeamSummary | TeamSummary[] | null),
    competition: Array.isArray(row.competition)
      ? (row.competition[0] as FixtureRecord['competition'])
      : (row.competition as FixtureRecord['competition']),
    venue: Array.isArray(row.venue)
      ? ((row.venue[0] as FixtureRecord['venue']) ?? null)
      : ((row.venue as FixtureRecord['venue']) ?? null),
  };
}

export async function fetchFixtures(): Promise<FixtureRecord[]> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('fixtures')
    .select(fixtureSelect)
    .order('kickoff_at', { ascending: true });
  if (error) {
    logger.error('Fikstür alınamadı', { code: 'fixtures.list', cause: error.message });
    throw error;
  }
  return (data ?? []).map((row) => mapFixture(row as Record<string, unknown>));
}

export async function fetchFixture(id: string): Promise<FixtureRecord | null> {
  const supabase = requireClient();
  const { data, error } = await supabase.from('fixtures').select(fixtureSelect).eq('id', id).maybeSingle();
  if (error) {
    logger.error('Maç detayı alınamadı', { code: 'fixtures.detail', cause: error.message });
    throw error;
  }
  return data ? mapFixture(data as Record<string, unknown>) : null;
}

export async function fetchActiveStandings(): Promise<{
  competition: { id: string; name: string; season_label: string } | null;
  rows: StandingRecord[];
}> {
  const supabase = requireClient();
  const { data: competition, error: competitionError } = await supabase
    .from('competitions')
    .select('id, name, season_label')
    .eq('is_active', true)
    .order('season_label', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (competitionError) {
    logger.error('Lig okunamadı', { code: 'standings.competition', cause: competitionError.message });
    throw competitionError;
  }
  if (!competition) {
    return { competition: null, rows: [] };
  }
  const { data, error } = await supabase
    .from('standings')
    .select(
      'position, played, wins, draws, losses, goals_for, goals_against, goal_difference, points, team:teams!team_id(id, name, short_name, slug, is_eskisehirspor, crest_path)',
    )
    .eq('competition_id', competition.id)
    .order('position', { ascending: true });
  if (error) {
    logger.error('Puan durumu alınamadı', { code: 'standings.list', cause: error.message });
    throw error;
  }
  return {
    competition,
    rows: (data ?? []).map((row) => ({
      position: row.position,
      played: row.played,
      wins: row.wins,
      draws: row.draws,
      losses: row.losses,
      goals_for: row.goals_for,
      goals_against: row.goals_against,
      goal_difference: row.goal_difference,
      points: row.points,
      team: asTeam(row.team as TeamSummary | TeamSummary[] | null),
    })),
  };
}

export async function fetchMatchEvents(fixtureId: string): Promise<MatchEventRecord[]> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('match_events')
    .select(
      'id, fixture_id, minute, extra_minute, event_type, team_id, player_id, related_player_id, reversed_at, sort_key',
    )
    .eq('fixture_id', fixtureId)
    .is('reversed_at', null)
    .order('sort_key', { ascending: true });
  if (error) {
    logger.error('Maç olayları alınamadı', { code: 'events.list', cause: error.message });
    throw error;
  }
  return (data ?? []) as MatchEventRecord[];
}

export async function fetchServerNow(): Promise<string> {
  const supabase = requireClient();
  const { data, error } = await supabase.rpc('server_now');
  if (error) {
    logger.error('Sunucu saati alınamadı', { code: 'server_now', cause: error.message });
    return new Date().toISOString();
  }
  return String(data);
}
