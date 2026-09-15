import { describe, expect, it } from 'vitest';
import { hasContentAccess } from './access';
import { resolveHomeState } from './home';
import {
  classifyFixtureStatus,
  displaysScore,
  isCompletedFixture,
  isInactiveFixture,
  isUpcomingFixture,
  isValidStandingRow,
  standingGoalDifference,
} from './matches';
import {
  canDeleteNews,
  filterPublicNews,
  isNewsPubliclyVisible,
  NewsArticleWriteSchema,
  slugify,
  slugTaken,
} from './news';

describe('news visibility', () => {
  const now = new Date('2026-09-15T12:00:00.000Z');

  it('does not expose unpublished articles', () => {
    expect(
      isNewsPubliclyVisible({ status: 'draft', published_at: '2026-09-01T00:00:00.000Z', now }),
    ).toBe(false);
    expect(
      isNewsPubliclyVisible({
        status: 'scheduled',
        published_at: '2026-09-01T00:00:00.000Z',
        now,
      }),
    ).toBe(false);
    expect(
      isNewsPubliclyVisible({ status: 'archived', published_at: '2026-09-01T00:00:00.000Z', now }),
    ).toBe(false);
    expect(isNewsPubliclyVisible({ status: 'published', published_at: null, now })).toBe(false);
    expect(
      isNewsPubliclyVisible({
        status: 'published',
        published_at: '2026-09-16T00:00:00.000Z',
        now,
      }),
    ).toBe(false);
  });

  it('exposes published articles whose publish time has arrived', () => {
    expect(
      isNewsPubliclyVisible({
        status: 'published',
        published_at: '2026-09-15T11:00:00.000Z',
        now,
      }),
    ).toBe(true);
  });

  it('filters mixed lists to public rows only', () => {
    const visible = filterPublicNews(
      [
        { status: 'draft' as const, published_at: '2026-09-01T00:00:00.000Z' },
        { status: 'published' as const, published_at: '2026-09-15T11:00:00.000Z' },
      ],
      now,
    );
    expect(visible).toHaveLength(1);
  });

  it('rejects duplicate-hostile slug shapes and allows generated slugs', () => {
    expect(slugify('A Takım Kampı!')).toBe('a-takim-kampi');
    expect(NewsArticleWriteSchema.safeParse({
      title: 'Kamp',
      slug: 'kamp',
      content: 'x',
      status: 'draft',
      is_announcement: false,
      category_ids: [],
    }).success).toBe(true);
    expect(NewsArticleWriteSchema.safeParse({
      title: 'Kamp',
      slug: 'Kamp',
      content: 'x',
      status: 'published',
    }).success).toBe(false);
  });

  it('treats identical slugs as taken except for the same article', () => {
    const rows = [{ id: '1', slug: 'kamp' }];
    expect(slugTaken(rows, 'kamp')).toBe(true);
    expect(slugTaken(rows, 'kamp', '1')).toBe(false);
    expect(slugTaken(rows, 'diger')).toBe(false);
  });

  it('only allows safe deletes', () => {
    expect(canDeleteNews('draft')).toBe(true);
    expect(canDeleteNews('archived')).toBe(true);
    expect(canDeleteNews('published')).toBe(false);
    expect(canDeleteNews('scheduled')).toBe(false);
  });

  it('does not let regular users manage official news', () => {
    expect(hasContentAccess(['user'])).toBe(false);
    expect(hasContentAccess(['moderator'])).toBe(false);
    expect(hasContentAccess(['editor'])).toBe(true);
  });
});

describe('fixtures', () => {
  it('classifies upcoming, live, completed, postponed and cancelled', () => {
    expect(isUpcomingFixture('scheduled')).toBe(true);
    expect(classifyFixtureStatus('live')).toBe('live');
    expect(classifyFixtureStatus('halftime')).toBe('live');
    expect(isCompletedFixture('finished')).toBe(true);
    expect(isInactiveFixture('postponed')).toBe(true);
    expect(isInactiveFixture('cancelled')).toBe(true);
    expect(displaysScore('finished')).toBe(true);
    expect(displaysScore('scheduled')).toBe(false);
  });
});

describe('standings', () => {
  const base = {
    competition_id: '11111111-1111-1111-1111-111111111111',
    team_id: '22222222-2222-2222-2222-222222222222',
    position: 1,
    played: 3,
    wins: 1,
    draws: 1,
    losses: 1,
    goals_for: 4,
    goals_against: 2,
    points: 4,
  };

  it('accepts a valid row and derives goal difference', () => {
    expect(isValidStandingRow(base)).toBe(true);
    expect(standingGoalDifference(base)).toBe(2);
  });

  it('rejects played totals that do not match W+D+L', () => {
    expect(isValidStandingRow({ ...base, played: 9 })).toBe(false);
  });
});

describe('home surface', () => {
  it('maps loading, empty, error and loaded states', () => {
    expect(
      resolveHomeState({
        isLoading: true,
        errorMessage: null,
        hasNextMatch: false,
        hasNews: false,
        hasRecentResult: false,
      }),
    ).toBe('loading');
    expect(
      resolveHomeState({
        isLoading: false,
        errorMessage: 'fail',
        hasNextMatch: true,
        hasNews: true,
        hasRecentResult: true,
      }),
    ).toBe('error');
    expect(
      resolveHomeState({
        isLoading: false,
        errorMessage: null,
        hasNextMatch: false,
        hasNews: false,
        hasRecentResult: false,
      }),
    ).toBe('empty');
    expect(
      resolveHomeState({
        isLoading: false,
        errorMessage: null,
        hasNextMatch: true,
        hasNews: false,
        hasRecentResult: false,
      }),
    ).toBe('ready');
  });
});
