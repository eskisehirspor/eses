import { clubAwayTrip, type CatalogAwayTrip } from '@eskisehirspor/shared';
import type { FixtureRecord } from './api';

export function fixtureAwayTrip(fixture: FixtureRecord): CatalogAwayTrip | null {
  if (!fixture.away_team.is_eskisehirspor || fixture.home_team.is_eskisehirspor) {
    return null;
  }
  return clubAwayTrip(fixture.home_team.slug, 'eskisehirspor');
}
