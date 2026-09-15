const ISTANBUL_TZ = 'Europe/Istanbul';

export type IstanbulDateTimeParts = {
  day: string;
  month: string;
  year: string;
  hour: number;
  minute: number;
};

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function istanbulDateTimeParts(iso: string): IstanbulDateTimeParts | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const parts = new Intl.DateTimeFormat('tr-TR', {
    timeZone: ISTANBUL_TZ,
    hourCycle: 'h23',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  const hour = Number.parseInt(read('hour'), 10);
  const minute = Number.parseInt(read('minute'), 10);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }
  return {
    day: read('day'),
    month: read('month'),
    year: read('year'),
    hour,
    minute,
  };
}

/**
 * Catalog kickoffs without a published clock are stored as 00:00 Europe/Istanbul
 * because `fixtures.kickoff_at` is NOT NULL. That sentinel is not a match time.
 */
export function hasKnownKickoffTime(iso: string): boolean {
  const parts = istanbulDateTimeParts(iso);
  if (!parts) {
    return false;
  }
  return parts.hour !== 0 || parts.minute !== 0;
}

export function formatKickoffDate(iso: string): string {
  const parts = istanbulDateTimeParts(iso);
  if (!parts) {
    return '';
  }
  return `${parts.day}.${parts.month}.${parts.year}`;
}

export function formatKickoffTime(iso: string): string | null {
  const parts = istanbulDateTimeParts(iso);
  if (!parts || !hasKnownKickoffTime(iso)) {
    return null;
  }
  return `${pad2(parts.hour)}:${pad2(parts.minute)}`;
}

export function formatKickoffLabel(iso: string): string {
  const date = formatKickoffDate(iso);
  const time = formatKickoffTime(iso);
  if (!date) {
    return '';
  }
  return time ? `${date} · ${time}` : date;
}
