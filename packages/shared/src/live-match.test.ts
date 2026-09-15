import { describe, expect, it } from 'vitest';
import { alignedNowMs, deriveMatchClock, serverOffsetMs } from './live-clock';
import {
  applyLiveMatchOperation,
  canCorrectLiveMatch,
  canOperateLiveMatch,
  scoreFromActiveGoals,
  toLiveMatchState,
  type LiveMatchSnapshot,
} from './live-match';

const HOME = '11111111-1111-1111-1111-111111111111';
const AWAY = '22222222-2222-2222-2222-222222222222';
const OTHER = '33333333-3333-3333-3333-333333333333';
const PLAYER_HOME = 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1';
const PLAYER_AWAY = 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1';

function scheduled(): LiveMatchSnapshot {
  return {
    id: 'fix-1',
    status: 'scheduled',
    homeTeamId: HOME,
    awayTeamId: AWAY,
    homeScore: 0,
    awayScore: 0,
    startedAt: null,
    secondHalfStartedAt: null,
    endedAt: null,
  };
}

const squad = [
  { id: PLAYER_HOME, teamId: HOME },
  { id: PLAYER_AWAY, teamId: AWAY },
];

describe('live match access', () => {
  it('blocks users, moderators and editors from live mutation', () => {
    expect(canOperateLiveMatch(['user'])).toBe(false);
    expect(canOperateLiveMatch(['moderator'])).toBe(false);
    expect(canOperateLiveMatch(['editor'])).toBe(false);
    expect(canOperateLiveMatch(['admin'])).toBe(true);
    expect(canOperateLiveMatch(['super_admin'])).toBe(true);
    expect(canCorrectLiveMatch(['admin'])).toBe(false);
    expect(canCorrectLiveMatch(['super_admin'])).toBe(true);
  });
});

describe('live match transitions', () => {
  it('starts a scheduled match once', () => {
    const started = applyLiveMatchOperation({
      roles: ['admin'],
      snapshot: scheduled(),
      events: [],
      action: { type: 'start_match' },
      nowIso: '2026-09-15T16:00:00.000Z',
    });
    expect(started.ok).toBe(true);
    if (!started.ok) {
      return;
    }
    expect(started.snapshot.status).toBe('live');
    expect(started.snapshot.startedAt).toBe('2026-09-15T16:00:00.000Z');
    expect(started.snapshot.homeScore).toBe(0);
    expect(started.events.map((event) => event.type)).toContain('period_start');

    const again = applyLiveMatchOperation({
      roles: ['admin'],
      snapshot: started.snapshot,
      events: started.events,
      action: { type: 'start_match' },
      nowIso: '2026-09-15T16:01:00.000Z',
    });
    expect(again).toEqual({ ok: false, error: 'match_already_started' });
  });

  it('walks live -> halftime -> live -> finished', () => {
    let state = applyLiveMatchOperation({
      roles: ['admin'],
      snapshot: scheduled(),
      events: [],
      action: { type: 'start_match' },
      nowIso: '2026-09-15T16:00:00.000Z',
    });
    expect(state.ok).toBe(true);
    if (!state.ok) {
      return;
    }
    state = applyLiveMatchOperation({
      roles: ['admin'],
      snapshot: state.snapshot,
      events: state.events,
      action: { type: 'halftime' },
      nowIso: '2026-09-15T16:45:00.000Z',
    });
    expect(state.ok && state.snapshot.status).toBe('halftime');
    if (!state.ok) {
      return;
    }
    state = applyLiveMatchOperation({
      roles: ['admin'],
      snapshot: state.snapshot,
      events: state.events,
      action: { type: 'second_half' },
      nowIso: '2026-09-15T17:00:00.000Z',
    });
    expect(state.ok && state.snapshot.status).toBe('live');
    expect(state.ok && state.snapshot.secondHalfStartedAt).toBe('2026-09-15T17:00:00.000Z');
    if (!state.ok) {
      return;
    }
    state = applyLiveMatchOperation({
      roles: ['admin'],
      snapshot: state.snapshot,
      events: state.events,
      action: { type: 'finish_match' },
      nowIso: '2026-09-15T17:48:00.000Z',
    });
    expect(state.ok && state.snapshot.status).toBe('finished');
    expect(state.ok && state.snapshot.endedAt).toBe('2026-09-15T17:48:00.000Z');
  });

  it('cannot finish a scheduled match', () => {
    expect(
      applyLiveMatchOperation({
        roles: ['admin'],
        snapshot: scheduled(),
        events: [],
        action: { type: 'finish_match' },
        nowIso: '2026-09-15T16:00:00.000Z',
      }),
    ).toEqual({ ok: false, error: 'match_not_live' });
  });

  it('rejects unauthorized mutation', () => {
    expect(
      applyLiveMatchOperation({
        roles: ['user'],
        snapshot: scheduled(),
        events: [],
        action: { type: 'start_match' },
        nowIso: '2026-09-15T16:00:00.000Z',
      }),
    ).toEqual({ ok: false, error: 'live_forbidden' });
  });
});

describe('goals', () => {
  it('increments the correct side and rejects unrelated teams', () => {
    const live = applyLiveMatchOperation({
      roles: ['admin'],
      snapshot: scheduled(),
      events: [],
      action: { type: 'start_match' },
      nowIso: '2026-09-15T16:00:00.000Z',
    });
    expect(live.ok).toBe(true);
    if (!live.ok) {
      return;
    }
    const goal = applyLiveMatchOperation({
      roles: ['admin'],
      snapshot: live.snapshot,
      events: live.events,
      action: { type: 'add_goal', teamId: HOME, playerId: PLAYER_HOME },
      nowIso: '2026-09-15T16:12:00.000Z',
      squad,
    });
    expect(goal.ok).toBe(true);
    if (!goal.ok) {
      return;
    }
    expect(goal.snapshot.homeScore).toBe(1);
    expect(goal.snapshot.awayScore).toBe(0);
    expect(goal.events.some((event) => event.type === 'goal' && event.fixtureId === 'fix-1')).toBe(true);
    expect(scoreFromActiveGoals(goal.snapshot, goal.events)).toEqual({ homeScore: 1, awayScore: 0 });

    expect(
      applyLiveMatchOperation({
        roles: ['admin'],
        snapshot: goal.snapshot,
        events: goal.events,
        action: { type: 'add_goal', teamId: OTHER },
        nowIso: '2026-09-15T16:13:00.000Z',
        squad,
      }),
    ).toEqual({ ok: false, error: 'team_not_in_fixture' });
  });

  it('lets super admin reverse a goal and keeps score consistent', () => {
    const live = applyLiveMatchOperation({
      roles: ['super_admin'],
      snapshot: scheduled(),
      events: [],
      action: { type: 'start_match' },
      nowIso: '2026-09-15T16:00:00.000Z',
    });
    expect(live.ok).toBe(true);
    if (!live.ok) {
      return;
    }
    const goal = applyLiveMatchOperation({
      roles: ['super_admin'],
      snapshot: live.snapshot,
      events: live.events,
      action: { type: 'add_goal', teamId: AWAY, playerId: PLAYER_AWAY },
      nowIso: '2026-09-15T16:20:00.000Z',
      squad,
    });
    expect(goal.ok).toBe(true);
    if (!goal.ok) {
      return;
    }
    const eventId = goal.events.find((event) => event.type === 'goal')?.id;
    expect(eventId).toBeTruthy();
    const adminBlocked = applyLiveMatchOperation({
      roles: ['admin'],
      snapshot: goal.snapshot,
      events: goal.events,
      action: { type: 'reverse_event', eventId: eventId! },
      nowIso: '2026-09-15T16:21:00.000Z',
      squad,
    });
    expect(adminBlocked).toEqual({ ok: false, error: 'correct_forbidden' });

    const reversed = applyLiveMatchOperation({
      roles: ['super_admin'],
      snapshot: goal.snapshot,
      events: goal.events,
      action: { type: 'reverse_event', eventId: eventId! },
      nowIso: '2026-09-15T16:21:00.000Z',
      squad,
    });
    expect(reversed.ok).toBe(true);
    if (!reversed.ok) {
      return;
    }
    expect(reversed.snapshot.awayScore).toBe(0);
    expect(scoreFromActiveGoals(reversed.snapshot, reversed.events)).toEqual({
      homeScore: 0,
      awayScore: 0,
    });
  });
});

describe('clock', () => {
  it('derives first half, extra, freeze at HT, and second half from timestamps', () => {
    const start = Date.parse('2026-09-15T16:00:00.000Z');
    expect(
      deriveMatchClock({
        status: 'live',
        startedAt: '2026-09-15T16:00:00.000Z',
        secondHalfStartedAt: null,
        endedAt: null,
        nowMs: start + 12 * 60_000 + 42_000,
      }).label,
    ).toBe("12'");

    expect(
      deriveMatchClock({
        status: 'live',
        startedAt: '2026-09-15T16:00:00.000Z',
        secondHalfStartedAt: null,
        endedAt: null,
        nowMs: start + 47 * 60_000,
      }).label,
    ).toBe("45+2'");

    expect(
      deriveMatchClock({
        status: 'halftime',
        startedAt: '2026-09-15T16:00:00.000Z',
        secondHalfStartedAt: null,
        endedAt: null,
        nowMs: start + 50 * 60_000,
      }),
    ).toMatchObject({ running: false, label: "45'", period: 'halftime' });

    const second = Date.parse('2026-09-15T17:00:00.000Z');
    expect(
      deriveMatchClock({
        status: 'live',
        startedAt: '2026-09-15T16:00:00.000Z',
        secondHalfStartedAt: '2026-09-15T17:00:00.000Z',
        endedAt: null,
        nowMs: second + 10 * 60_000,
      }).label,
    ).toBe("55'");
  });

  it('aligns client now to server_now instead of trusting device clock', () => {
    const offset = serverOffsetMs('2026-09-15T16:00:05.000Z', Date.parse('2026-09-15T16:00:00.000Z'));
    expect(offset).toBe(5000);
    expect(alignedNowMs(Date.parse('2026-09-15T16:00:00.000Z'), offset)).toBe(
      Date.parse('2026-09-15T16:00:05.000Z'),
    );
  });
});

describe('live domain model', () => {
  it('drops events that do not belong to the fixture', () => {
    const state = toLiveMatchState({
      fixtureId: 'fix-1',
      status: 'live',
      homeScore: 1,
      awayScore: 0,
      startedAt: '2026-09-15T16:00:00.000Z',
      secondHalfStartedAt: null,
      endedAt: null,
      liveUpdatedAt: '2026-09-15T16:12:00.000Z',
      events: [
        {
          id: '1',
          fixtureId: 'fix-1',
          type: 'goal',
          teamId: HOME,
          playerId: null,
          relatedPlayerId: null,
          reversedAt: null,
        },
        {
          id: '2',
          fixtureId: 'other',
          type: 'goal',
          teamId: HOME,
          playerId: null,
          relatedPlayerId: null,
          reversedAt: null,
        },
      ],
    });
    expect(state.events).toHaveLength(1);
    expect(state.events[0]?.fixtureId).toBe('fix-1');
  });
});
