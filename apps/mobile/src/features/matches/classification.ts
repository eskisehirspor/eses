import { classifyFixtureStatus } from '@eskisehirspor/shared';
import type { FixtureRecord } from './api';

export function classifyFixtures(fixtures: FixtureRecord[]) {
  const upcoming = fixtures
    .filter((fixture) => classifyFixtureStatus(fixture.status) === 'upcoming')
    .slice()
    .sort((a, b) => +new Date(a.kickoff_at) - +new Date(b.kickoff_at));
  const live = fixtures.filter((fixture) => classifyFixtureStatus(fixture.status) === 'live');
  const inactive = fixtures.filter((fixture) => classifyFixtureStatus(fixture.status) === 'inactive');
  const recent = fixtures
    .filter((fixture) => classifyFixtureStatus(fixture.status) === 'completed')
    .slice()
    .sort((a, b) => +new Date(b.kickoff_at) - +new Date(a.kickoff_at));
  return { upcoming: [...live, ...upcoming, ...inactive], recent };
}

export function isClubFixture(fixture: FixtureRecord) {
  return fixture.home_team.is_eskisehirspor || fixture.away_team.is_eskisehirspor;
}

export function clubFixtures(fixtures: FixtureRecord[]) {
  return fixtures.filter(isClubFixture);
}

export function partitionClubFixtures(fixtures: FixtureRecord[]) {
  const club: FixtureRecord[] = [];
  const rest: FixtureRecord[] = [];
  for (const fixture of fixtures) {
    if (isClubFixture(fixture)) {
      club.push(fixture);
    } else {
      rest.push(fixture);
    }
  }
  return { club, rest };
}
