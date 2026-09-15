import { describe, expect, it } from 'vitest';
import { classifyFixtures, partitionClubFixtures } from './classification';
import type { FixtureRecord } from './api';

const team = (id: string, club = false) => ({
  id,
  name: id,
  short_name: id,
  slug: id,
  is_eskisehirspor: club,
  crest_path: null,
});

function fixture(overrides: Partial<FixtureRecord> & Pick<FixtureRecord, 'id' | 'status' | 'kickoff_at'>): FixtureRecord {
  return {
    home_score: null,
    away_score: null,
    round_label: null,
    started_at: null,
    second_half_started_at: null,
    ended_at: null,
    live_updated_at: null,
    home_team: team('home', true),
    away_team: team('away'),
    competition: { id: 'c', name: 'Lig', season_label: '2026-27' },
    venue: { id: 'v', name: 'Stadyum', city: 'Eskişehir' },
    ...overrides,
  };
}

describe('fixture lists', () => {
  it('puts scheduled in upcoming and finished in recent, newest first', () => {
    const { upcoming, recent } = classifyFixtures([
      fixture({ id: 'old', status: 'finished', kickoff_at: '2026-09-01T00:00:00.000Z', home_score: 1, away_score: 0 }),
      fixture({ id: 'new', status: 'finished', kickoff_at: '2026-09-10T00:00:00.000Z', home_score: 2, away_score: 0 }),
      fixture({ id: 'next', status: 'scheduled', kickoff_at: '2026-09-20T00:00:00.000Z' }),
      fixture({ id: 'live', status: 'live', kickoff_at: '2026-09-15T00:00:00.000Z' }),
      fixture({ id: 'post', status: 'postponed', kickoff_at: '2026-09-12T00:00:00.000Z' }),
      fixture({ id: 'off', status: 'cancelled', kickoff_at: '2026-09-08T00:00:00.000Z' }),
    ]);
    expect(upcoming.map((item) => item.id)).toEqual(['live', 'next', 'post', 'off']);
    expect(recent.map((item) => item.id)).toEqual(['new', 'old']);
  });

  it('separates Eskişehirspor fixtures from the rest of the group', () => {
    const club = fixture({ id: 'club', status: 'scheduled', kickoff_at: '2026-09-20T00:00:00.000Z' });
    const other = fixture({
      id: 'other',
      status: 'scheduled',
      kickoff_at: '2026-09-20T00:00:00.000Z',
      home_team: team('altay'),
      away_team: team('usak'),
    });
    expect(partitionClubFixtures([club, other])).toEqual({
      club: [club],
      rest: [other],
    });
  });
});
