import { formatKickoffDate, formatKickoffLabel, formatKickoffTime, hasKnownKickoffTime } from '@eskisehirspor/shared';

export function formatDateTime(iso: string): string {
  return formatKickoffLabel(iso);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
}

export function formatMatchDay(iso: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Istanbul',
  }).format(new Date(iso));
}

export { formatKickoffDate, formatKickoffLabel, formatKickoffTime, hasKnownKickoffTime };
