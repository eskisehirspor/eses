import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export type AdminTeam = {
  id: string;
  name: string;
  short_name: string;
  slug: string;
  is_eskisehirspor: boolean;
};

export type AdminPlayer = {
  id: string;
  team_id: string;
  display_name: string;
  shirt_number: number | null;
  position: string | null;
  is_active: boolean;
};

export type AdminFixtureListRow = {
  id: string;
  kickoff_at: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  live_source: string;
  round_label: string | null;
  home_team: AdminTeam;
  away_team: AdminTeam;
};

export type AdminMatchEvent = {
  id: string;
  minute: number | null;
  extra_minute: number | null;
  event_type: string;
  team_id: string | null;
  player_id: string | null;
  related_player_id: string | null;
  reversed_at: string | null;
  created_at: string;
  notify_kind: string | null;
};

function asTeam(value: AdminTeam | AdminTeam[] | null): AdminTeam {
  const team = Array.isArray(value) ? value[0] : value;
  if (!team) {
    throw new Error('missing_team');
  }
  return team;
}

export async function listAdminFixtures(): Promise<AdminFixtureListRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('fixtures')
    .select(
      'id, kickoff_at, status, home_score, away_score, live_source, round_label, home_team:teams!home_team_id(id, name, short_name, slug, is_eskisehirspor), away_team:teams!away_team_id(id, name, short_name, slug, is_eskisehirspor)',
    )
    .order('kickoff_at', { ascending: true });
  if (error) {
    logger.error('Admin fikstür listesi', { code: 'admin.fixtures.list', cause: error.message });
    throw error;
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    kickoff_at: row.kickoff_at,
    status: row.status,
    home_score: row.home_score,
    away_score: row.away_score,
    live_source: row.live_source,
    round_label: row.round_label,
    home_team: asTeam(row.home_team as AdminTeam | AdminTeam[] | null),
    away_team: asTeam(row.away_team as AdminTeam | AdminTeam[] | null),
  }));
}

export async function getAdminFixture(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('fixtures')
    .select(
      'id, kickoff_at, status, home_score, away_score, live_source, round_label, started_at, second_half_started_at, ended_at, live_updated_at, home_team_id, away_team_id, home_team:teams!home_team_id(id, name, short_name, slug, is_eskisehirspor), away_team:teams!away_team_id(id, name, short_name, slug, is_eskisehirspor)',
    )
    .eq('id', id)
    .maybeSingle();
  if (error) {
    logger.error('Admin maç detayı', { code: 'admin.fixtures.detail', cause: error.message });
    throw error;
  }
  if (!data) {
    return null;
  }
  return {
    ...data,
    home_team: asTeam(data.home_team as AdminTeam | AdminTeam[] | null),
    away_team: asTeam(data.away_team as AdminTeam | AdminTeam[] | null),
  };
}

export async function listFixturePlayers(homeTeamId: string, awayTeamId: string): Promise<AdminPlayer[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('players')
    .select('id, team_id, display_name, shirt_number, position, is_active')
    .in('team_id', [homeTeamId, awayTeamId])
    .eq('is_active', true)
    .order('shirt_number', { ascending: true });
  if (error) {
    logger.error('Kadro okunamadı', { code: 'admin.players.list', cause: error.message });
    throw error;
  }
  return data ?? [];
}

export async function listAdminMatchEvents(fixtureId: string): Promise<AdminMatchEvent[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('match_events')
    .select('id, minute, extra_minute, event_type, team_id, player_id, related_player_id, reversed_at, created_at, notify_kind')
    .eq('fixture_id', fixtureId)
    .order('sort_key', { ascending: true });
  if (error) {
    logger.error('Olaylar okunamadı', { code: 'admin.events.list', cause: error.message });
    throw error;
  }
  return data ?? [];
}

export async function fetchServerNow(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('server_now');
  if (error) {
    logger.error('server_now alınamadı', { code: 'admin.server_now', cause: error.message });
    return new Date().toISOString();
  }
  return String(data);
}
