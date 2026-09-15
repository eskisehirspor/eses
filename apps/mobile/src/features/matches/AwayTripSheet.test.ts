import { describe, expect, it } from 'vitest';
import { fixtureAwayTrip } from './away-trip';
import type { FixtureRecord } from './api';

const team = (slug: string, club = false) => ({
  id: slug,
  name: slug,
  short_name: slug,
  slug,
  is_eskisehirspor: club,
  crest_path: null,
});

function fixture(home: string, away: string, homeClub = false, awayClub = false): FixtureRecord {
  return {
    id: `${home}-${away}`,
    kickoff_at: '2026-09-13T13:30:00.000Z',
    status: 'scheduled',
    round_label: '2. Hafta',
    home_score: null,
    away_score: null,
    started_at: null,
    second_half_started_at: null,
    ended_at: null,
    live_updated_at: null,
    home_team: team(home, homeClub),
    away_team: team(away, awayClub),
    competition: { id: 'c', name: 'Lig', season_label: '2026-2027' },
    venue: null,
  };
}

describe('away trip chip', () => {
  it('shows distance only for Eskişehirspor away fixtures', () => {
    expect(fixtureAwayTrip(fixture('eskisehirspor', 'usak-spor', true, false))).toBeNull();
    expect(fixtureAwayTrip(fixture('usak-spor', 'eskisehirspor', false, true))).toMatchObject({
      city: 'Uşak',
      approxRoadKm: 217,
    });
    expect(fixtureAwayTrip(fixture('usak-spor', 'altay'))).toBeNull();
  });
});
