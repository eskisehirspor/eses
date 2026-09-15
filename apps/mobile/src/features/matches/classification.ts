import { classifyFixtureStatus } from '@eskisehirspor/shared';
import type { FixtureRecord } from './api';

export function classifyFixtures(fixtures: FixtureRecord[]) {
  const upcoming = fixtures.filter((fixture) => classifyFixtureStatus(fixture.status) === 'upcoming');
  const live = fixtures.filter((fixture) => classifyFixtureStatus(fixture.status) === 'live');
  const inactive = fixtures.filter((fixture) => classifyFixtureStatus(fixture.status) === 'inactive');
  const recent = fixtures
    .filter((fixture) => classifyFixtureStatus(fixture.status) === 'completed')
    .slice()
    .sort((a, b) => +new Date(b.kickoff_at) - +new Date(a.kickoff_at));
  return { upcoming: [...live, ...upcoming, ...inactive], recent };
}
