import type { Role } from './roles';
import { hasOpsAdminAccess } from './access';
import type { FixtureStatus } from './matches';
import type { MatchEventType } from './live-clock';

export function canOperateLiveMatch(roles: readonly Role[]): boolean {
  return hasOpsAdminAccess(roles);
}

export function canCorrectLiveMatch(roles: readonly Role[]): boolean {
  return roles.includes('super_admin');
}

export type LiveMatchSnapshot = {
  id: string;
  status: FixtureStatus;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  startedAt: string | null;
  secondHalfStartedAt: string | null;
  endedAt: string | null;
};

export type LiveMatchEventRecord = {
  id: string;
  fixtureId: string;
  type: MatchEventType;
  teamId: string | null;
  playerId: string | null;
  relatedPlayerId: string | null;
  reversedAt: string | null;
};

export type LiveMatchAction =
  | { type: 'start_match' }
  | { type: 'halftime' }
  | { type: 'second_half' }
  | { type: 'finish_match' }
  | { type: 'add_goal'; teamId: string; playerId?: string | null }
  | { type: 'add_card'; teamId: string; playerId: string; cardType: 'yellow_card' | 'red_card' }
  | { type: 'add_substitution'; teamId: string; playerOutId: string; playerInId: string }
  | { type: 'reverse_event'; eventId: string };

export type LiveMatchError =
  | 'live_forbidden'
  | 'correct_forbidden'
  | 'match_not_scheduled'
  | 'match_already_started'
  | 'match_not_live'
  | 'match_not_live_first_half'
  | 'match_not_halftime'
  | 'team_not_in_fixture'
  | 'player_not_on_team'
  | 'invalid_substitution'
  | 'event_not_found'
  | 'event_already_reversed'
  | 'event_wrong_fixture';

export type LiveMatchApplyResult =
  | { ok: true; snapshot: LiveMatchSnapshot; events: LiveMatchEventRecord[] }
  | { ok: false; error: LiveMatchError };

function belongsToFixture(snapshot: LiveMatchSnapshot, teamId: string): boolean {
  return teamId === snapshot.homeTeamId || teamId === snapshot.awayTeamId;
}

export function scoreFromActiveGoals(
  snapshot: Pick<LiveMatchSnapshot, 'homeTeamId' | 'awayTeamId'>,
  events: readonly LiveMatchEventRecord[],
): { homeScore: number; awayScore: number } {
  let homeScore = 0;
  let awayScore = 0;
  for (const event of events) {
    if (event.type !== 'goal' || event.reversedAt || !event.teamId) {
      continue;
    }
    if (event.teamId === snapshot.homeTeamId) {
      homeScore += 1;
    } else if (event.teamId === snapshot.awayTeamId) {
      awayScore += 1;
    }
  }
  return { homeScore, awayScore };
}

export function applyLiveMatchOperation(input: {
  roles: readonly Role[];
  snapshot: LiveMatchSnapshot;
  events: LiveMatchEventRecord[];
  action: LiveMatchAction;
  nowIso: string;
  squad?: ReadonlyArray<{ id: string; teamId: string }>;
}): LiveMatchApplyResult {
  const { action, snapshot } = input;
  const events = input.events.map((event) => ({ ...event }));
  const next: LiveMatchSnapshot = { ...snapshot };

  if (action.type === 'reverse_event') {
    if (!canCorrectLiveMatch(input.roles)) {
      return { ok: false, error: 'correct_forbidden' };
    }
  } else if (!canOperateLiveMatch(input.roles)) {
    return { ok: false, error: 'live_forbidden' };
  }

  const assertPlayer = (playerId: string | null | undefined, teamId: string): LiveMatchError | null => {
    if (!playerId) {
      return null;
    }
    const row = input.squad?.find((player) => player.id === playerId);
    if (!row || row.teamId !== teamId) {
      return 'player_not_on_team';
    }
    return null;
  };

  switch (action.type) {
    case 'start_match': {
      if (next.status !== 'scheduled' || next.startedAt) {
        return { ok: false, error: 'match_already_started' };
      }
      next.status = 'live';
      next.startedAt = input.nowIso;
      next.homeScore = next.homeScore || 0;
      next.awayScore = next.awayScore || 0;
      events.push({
        id: `evt-${events.length + 1}`,
        fixtureId: next.id,
        type: 'period_start',
        teamId: null,
        playerId: null,
        relatedPlayerId: null,
        reversedAt: null,
      });
      break;
    }
    case 'halftime': {
      if (next.status !== 'live' || next.secondHalfStartedAt) {
        return { ok: false, error: 'match_not_live_first_half' };
      }
      next.status = 'halftime';
      events.push({
        id: `evt-${events.length + 1}`,
        fixtureId: next.id,
        type: 'halftime',
        teamId: null,
        playerId: null,
        relatedPlayerId: null,
        reversedAt: null,
      });
      break;
    }
    case 'second_half': {
      if (next.status !== 'halftime') {
        return { ok: false, error: 'match_not_halftime' };
      }
      next.status = 'live';
      next.secondHalfStartedAt = input.nowIso;
      events.push({
        id: `evt-${events.length + 1}`,
        fixtureId: next.id,
        type: 'second_half',
        teamId: null,
        playerId: null,
        relatedPlayerId: null,
        reversedAt: null,
      });
      break;
    }
    case 'finish_match': {
      if (next.status !== 'live' && next.status !== 'halftime') {
        return { ok: false, error: 'match_not_live' };
      }
      next.status = 'finished';
      next.endedAt = input.nowIso;
      events.push({
        id: `evt-${events.length + 1}`,
        fixtureId: next.id,
        type: 'full_time',
        teamId: null,
        playerId: null,
        relatedPlayerId: null,
        reversedAt: null,
      });
      break;
    }
    case 'add_goal': {
      if (next.status !== 'live') {
        return { ok: false, error: 'match_not_live' };
      }
      if (!belongsToFixture(next, action.teamId)) {
        return { ok: false, error: 'team_not_in_fixture' };
      }
      const playerError = assertPlayer(action.playerId, action.teamId);
      if (playerError) {
        return { ok: false, error: playerError };
      }
      if (action.teamId === next.homeTeamId) {
        next.homeScore += 1;
      } else {
        next.awayScore += 1;
      }
      events.push({
        id: `evt-${events.length + 1}`,
        fixtureId: next.id,
        type: 'goal',
        teamId: action.teamId,
        playerId: action.playerId ?? null,
        relatedPlayerId: null,
        reversedAt: null,
      });
      break;
    }
    case 'add_card': {
      if (next.status !== 'live') {
        return { ok: false, error: 'match_not_live' };
      }
      if (!belongsToFixture(next, action.teamId)) {
        return { ok: false, error: 'team_not_in_fixture' };
      }
      const playerError = assertPlayer(action.playerId, action.teamId);
      if (playerError) {
        return { ok: false, error: playerError };
      }
      events.push({
        id: `evt-${events.length + 1}`,
        fixtureId: next.id,
        type: action.cardType,
        teamId: action.teamId,
        playerId: action.playerId,
        relatedPlayerId: null,
        reversedAt: null,
      });
      break;
    }
    case 'add_substitution': {
      if (next.status !== 'live') {
        return { ok: false, error: 'match_not_live' };
      }
      if (!belongsToFixture(next, action.teamId)) {
        return { ok: false, error: 'team_not_in_fixture' };
      }
      if (action.playerOutId === action.playerInId) {
        return { ok: false, error: 'invalid_substitution' };
      }
      const outError = assertPlayer(action.playerOutId, action.teamId);
      const inError = assertPlayer(action.playerInId, action.teamId);
      if (outError) {
        return { ok: false, error: outError };
      }
      if (inError) {
        return { ok: false, error: inError };
      }
      events.push({
        id: `evt-${events.length + 1}`,
        fixtureId: next.id,
        type: 'substitution',
        teamId: action.teamId,
        playerId: action.playerOutId,
        relatedPlayerId: action.playerInId,
        reversedAt: null,
      });
      break;
    }
    case 'reverse_event': {
      const event = events.find((row) => row.id === action.eventId);
      if (!event) {
        return { ok: false, error: 'event_not_found' };
      }
      if (event.fixtureId !== next.id) {
        return { ok: false, error: 'event_wrong_fixture' };
      }
      if (event.reversedAt) {
        return { ok: false, error: 'event_already_reversed' };
      }
      event.reversedAt = input.nowIso;
      if (event.type === 'goal' && event.teamId) {
        if (event.teamId === next.homeTeamId) {
          next.homeScore = Math.max(0, next.homeScore - 1);
        } else if (event.teamId === next.awayTeamId) {
          next.awayScore = Math.max(0, next.awayScore - 1);
        }
      }
      break;
    }
  }

  return { ok: true, snapshot: next, events };
}

export type LiveMatchState = {
  fixtureId: string;
  status: FixtureStatus;
  homeScore: number;
  awayScore: number;
  startedAt: string | null;
  secondHalfStartedAt: string | null;
  endedAt: string | null;
  liveUpdatedAt: string | null;
  events: LiveMatchEventRecord[];
};

export function toLiveMatchState(input: {
  fixtureId: string;
  status: FixtureStatus;
  homeScore: number;
  awayScore: number;
  startedAt: string | null;
  secondHalfStartedAt: string | null;
  endedAt: string | null;
  liveUpdatedAt: string | null;
  events: LiveMatchEventRecord[];
}): LiveMatchState {
  return {
    fixtureId: input.fixtureId,
    status: input.status,
    homeScore: input.homeScore,
    awayScore: input.awayScore,
    startedAt: input.startedAt,
    secondHalfStartedAt: input.secondHalfStartedAt,
    endedAt: input.endedAt,
    liveUpdatedAt: input.liveUpdatedAt,
    events: input.events.filter((event) => event.fixtureId === input.fixtureId),
  };
}
