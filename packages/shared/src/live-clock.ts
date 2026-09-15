export const LIVE_SOURCES = ['manual', 'provider', 'hybrid'] as const;
export type LiveSource = (typeof LIVE_SOURCES)[number];

export const MATCH_EVENT_TYPES = [
  'goal',
  'yellow_card',
  'red_card',
  'substitution',
  'period_start',
  'halftime',
  'second_half',
  'full_time',
] as const;

export type MatchEventType = (typeof MATCH_EVENT_TYPES)[number];

export const MATCH_NOTIFY_KINDS = [
  'MATCH_START',
  'GOAL',
  'YELLOW_CARD',
  'RED_CARD',
  'SUBSTITUTION',
  'HALFTIME',
  'SECOND_HALF',
  'FULL_TIME',
] as const;

export type MatchNotifyKind = (typeof MATCH_NOTIFY_KINDS)[number];

export const MATCH_EVENT_LABELS: Record<MatchEventType, string> = {
  goal: 'Gol',
  yellow_card: 'Sarı kart',
  red_card: 'Kırmızı kart',
  substitution: 'Değişiklik',
  period_start: 'Başlangıç',
  halftime: 'Devre arası',
  second_half: 'İkinci yarı',
  full_time: 'Maç sonu',
};

export type MatchClockPeriod = 'pre' | 'first' | 'halftime' | 'second' | 'finished';

export type MatchClock = {
  running: boolean;
  displayMinute: number | null;
  extraMinute: number | null;
  label: string | null;
  period: MatchClockPeriod;
};

export type LiveClockInput = {
  status: 'scheduled' | 'live' | 'halftime' | 'finished' | 'postponed' | 'cancelled';
  startedAt: string | null;
  secondHalfStartedAt: string | null;
  endedAt: string | null;
  nowMs: number;
};

function formatClock(minute: number, extra: number | null): string {
  if (extra != null && extra > 0) {
    return `${minute}+${extra}'`;
  }
  return `${minute}'`;
}

/**
 * Football clock.
 *
 * Database stores:
 * - started_at: first-half kickoff (server now() at start_match)
 * - second_half_started_at: second-half restart
 * - ended_at: full time
 *
 * Clients must pass nowMs from server_now() (or Date.now() + serverOffset).
 * Device clock is never authoritative.
 *
 * First half display = floor((now - started_at) / 60s). After 45', extra minutes.
 * Halftime freezes at 45'.
 * Second half display = 45 + floor((now - second_half_started_at) / 60s). After 90', extra.
 */
export function deriveMatchClock(input: LiveClockInput): MatchClock {
  if (input.status === 'scheduled' || input.status === 'postponed' || input.status === 'cancelled') {
    return { running: false, displayMinute: null, extraMinute: null, label: null, period: 'pre' };
  }

  if (input.status === 'halftime') {
    return { running: false, displayMinute: 45, extraMinute: null, label: "45'", period: 'halftime' };
  }

  if (input.status === 'finished') {
    if (input.endedAt && input.secondHalfStartedAt) {
      const elapsed = Math.max(
        0,
        Math.floor((Date.parse(input.endedAt) - Date.parse(input.secondHalfStartedAt)) / 60_000),
      );
      const minute = 45 + elapsed;
      if (minute <= 90) {
        return { running: false, displayMinute: minute, extraMinute: null, label: formatClock(minute, null), period: 'finished' };
      }
      return {
        running: false,
        displayMinute: 90,
        extraMinute: minute - 90,
        label: formatClock(90, minute - 90),
        period: 'finished',
      };
    }
    return { running: false, displayMinute: 90, extraMinute: null, label: "90'", period: 'finished' };
  }

  if (input.status === 'live' && input.secondHalfStartedAt) {
    const elapsed = Math.max(0, Math.floor((input.nowMs - Date.parse(input.secondHalfStartedAt)) / 60_000));
    const minute = 45 + elapsed;
    if (minute <= 90) {
      return { running: true, displayMinute: minute, extraMinute: null, label: formatClock(minute, null), period: 'second' };
    }
    return {
      running: true,
      displayMinute: 90,
      extraMinute: minute - 90,
      label: formatClock(90, minute - 90),
      period: 'second',
    };
  }

  if (input.status === 'live' && input.startedAt) {
    const elapsed = Math.max(0, Math.floor((input.nowMs - Date.parse(input.startedAt)) / 60_000));
    if (elapsed <= 45) {
      return { running: true, displayMinute: elapsed, extraMinute: null, label: formatClock(elapsed, null), period: 'first' };
    }
    return {
      running: true,
      displayMinute: 45,
      extraMinute: elapsed - 45,
      label: formatClock(45, elapsed - 45),
      period: 'first',
    };
  }

  return { running: false, displayMinute: null, extraMinute: null, label: null, period: 'pre' };
}

export function serverOffsetMs(serverNowIso: string, deviceNowMs: number): number {
  return Date.parse(serverNowIso) - deviceNowMs;
}

export function alignedNowMs(deviceNowMs: number, offsetMs: number): number {
  return deviceNowMs + offsetMs;
}
