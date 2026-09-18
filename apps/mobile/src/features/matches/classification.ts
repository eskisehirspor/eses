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

/** Yaklaşan: Eskişehirspor's own upcoming/live/inactive fixtures only — no other clubs. */
export function clubUpcomingFixtures(fixtures: FixtureRecord[]): FixtureRecord[] {
  return classifyFixtures(fixtures).upcoming.filter(isClubFixture);
}

export type FixtureWeekGroup = {
  key: string;
  /** Raw `round_label` text, or null when the fixture has none — never invented. */
  label: string | null;
  fixtures: FixtureRecord[];
};

const UNLABELED_WEEK_KEY = '__unlabeled__';

/**
 * Fikstür: every fixture grouped by its exact `round_label`. Groups are ordered
 * by their earliest kickoff (round_label is free-text/admin-entered, so this is
 * more reliable than parsing the label). Fixtures with no label form a trailing
 * group rather than being assigned an invented week number.
 */
export function groupFixturesByWeek(fixtures: FixtureRecord[]): FixtureWeekGroup[] {
  const groups = new Map<string, FixtureRecord[]>();
  for (const fixture of fixtures) {
    const key = fixture.round_label ?? UNLABELED_WEEK_KEY;
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(fixture);
    } else {
      groups.set(key, [fixture]);
    }
  }
  const result: FixtureWeekGroup[] = Array.from(groups.entries()).map(([key, groupFixtures]) => ({
    key,
    label: key === UNLABELED_WEEK_KEY ? null : key,
    fixtures: groupFixtures.slice().sort((a, b) => +new Date(a.kickoff_at) - +new Date(b.kickoff_at)),
  }));
  result.sort((a, b) => {
    if (a.label === null) {
      return 1;
    }
    if (b.label === null) {
      return -1;
    }
    const aKickoff = a.fixtures[0]?.kickoff_at;
    const bKickoff = b.fixtures[0]?.kickoff_at;
    return (aKickoff ? +new Date(aKickoff) : 0) - (bKickoff ? +new Date(bKickoff) : 0);
  });
  return result;
}

/**
 * The week to default Fikstür to: the first group that is still live or has a
 * fixture whose kickoff hasn't passed yet. Once every fixture in every group
 * is in the past and finished, falls back to the last (most recent) group —
 * never leaves the app parked on an old, fully-played week.
 */
export function resolveCurrentWeekIndex(groups: FixtureWeekGroup[], nowMs: number): number {
  if (groups.length === 0) {
    return 0;
  }
  const isCurrentOrFuture = (fixture: FixtureRecord) =>
    classifyFixtureStatus(fixture.status) === 'live' || +new Date(fixture.kickoff_at) >= nowMs;
  const index = groups.findIndex((group) => group.fixtures.some(isCurrentOrFuture));
  return index === -1 ? groups.length - 1 : index;
}
