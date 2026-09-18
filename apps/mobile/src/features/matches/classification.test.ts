import { describe, expect, it } from 'vitest';
import {
  classifyFixtures,
  clubUpcomingFixtures,
  groupFixturesByWeek,
  partitionClubFixtures,
  resolveCurrentWeekIndex,
} from './classification';
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

describe('club upcoming fixtures', () => {
  it('keeps only Eskişehirspor fixtures for Yaklaşan', () => {
    const club = fixture({ id: 'club', status: 'scheduled', kickoff_at: '2026-09-20T00:00:00.000Z' });
    const other = fixture({
      id: 'other',
      status: 'scheduled',
      kickoff_at: '2026-09-18T00:00:00.000Z',
      home_team: team('altay'),
      away_team: team('usak'),
    });
    expect(clubUpcomingFixtures([club, other]).map((item) => item.id)).toEqual(['club']);
  });
});

describe('fixture week grouping', () => {
  it('groups by round_label, orders by earliest kickoff, unlabeled last', () => {
    const week3a = fixture({
      id: 'w3a',
      status: 'finished',
      kickoff_at: '2026-09-10T00:00:00.000Z',
      round_label: '3. Hafta',
    });
    const week3b = fixture({
      id: 'w3b',
      status: 'finished',
      kickoff_at: '2026-09-11T00:00:00.000Z',
      round_label: '3. Hafta',
    });
    const week4 = fixture({
      id: 'w4',
      status: 'scheduled',
      kickoff_at: '2026-09-20T00:00:00.000Z',
      round_label: '4. Hafta',
    });
    const unlabeled = fixture({
      id: 'u',
      status: 'scheduled',
      kickoff_at: '2026-09-05T00:00:00.000Z',
      round_label: null,
    });

    const groups = groupFixturesByWeek([week4, unlabeled, week3b, week3a]);

    expect(groups.map((group) => group.label)).toEqual(['3. Hafta', '4. Hafta', null]);
    expect(groups[0]?.fixtures.map((item) => item.id)).toEqual(['w3a', 'w3b']);
  });
});

describe('current week resolution', () => {
  it('skips fully-played weeks and lands on the first week with a fixture still ahead', () => {
    const week1 = fixture({ id: 'w1', status: 'finished', kickoff_at: '2026-09-06T00:00:00.000Z', round_label: '1. Hafta' });
    const week2 = fixture({ id: 'w2', status: 'finished', kickoff_at: '2026-09-13T00:00:00.000Z', round_label: '2. Hafta' });
    const week3 = fixture({ id: 'w3', status: 'scheduled', kickoff_at: '2026-09-19T16:00:00.000Z', round_label: '3. Hafta' });
    const week4 = fixture({ id: 'w4', status: 'scheduled', kickoff_at: '2026-09-27T19:00:00.000Z', round_label: '4. Hafta' });
    const groups = groupFixturesByWeek([week1, week2, week3, week4]);
    const now = +new Date('2026-09-18T00:00:00.000Z');

    expect(resolveCurrentWeekIndex(groups, now)).toBe(2);
    expect(groups[resolveCurrentWeekIndex(groups, now)]?.label).toBe('3. Hafta');
  });

  it('falls back to the last week once the whole season is finished', () => {
    const week1 = fixture({ id: 'w1', status: 'finished', kickoff_at: '2026-09-06T00:00:00.000Z', round_label: '1. Hafta' });
    const week2 = fixture({ id: 'w2', status: 'finished', kickoff_at: '2026-09-13T00:00:00.000Z', round_label: '2. Hafta' });
    const groups = groupFixturesByWeek([week1, week2]);
    const now = +new Date('2027-06-01T00:00:00.000Z');

    expect(resolveCurrentWeekIndex(groups, now)).toBe(1);
  });

  it('treats a live match as current even if its kickoff timestamp is already in the past', () => {
    const week1 = fixture({ id: 'w1', status: 'finished', kickoff_at: '2026-09-06T00:00:00.000Z', round_label: '1. Hafta' });
    const week2 = fixture({ id: 'w2', status: 'live', kickoff_at: '2026-09-13T15:00:00.000Z', round_label: '2. Hafta' });
    const groups = groupFixturesByWeek([week1, week2]);
    const now = +new Date('2026-09-13T15:40:00.000Z');

    expect(resolveCurrentWeekIndex(groups, now)).toBe(1);
  });

  it('returns 0 for an empty list rather than throwing', () => {
    expect(resolveCurrentWeekIndex([], Date.now())).toBe(0);
  });
});
