import { describe, expect, it } from 'vitest';
import { catalogKickoffIso } from './football-catalog';
import { formatKickoffLabel, formatKickoffTime, hasKnownKickoffTime } from './kickoff';

describe('kickoff display', () => {
  it('hides the 00:00 catalog sentinel and shows published clocks', () => {
    const unknown = catalogKickoffIso('2026-09-27', null);
    const known = catalogKickoffIso('2026-09-27', '19:00');
    expect(hasKnownKickoffTime(unknown)).toBe(false);
    expect(formatKickoffTime(unknown)).toBeNull();
    expect(formatKickoffLabel(unknown)).toBe('27.09.2026');
    expect(formatKickoffLabel(unknown)).not.toMatch(/00:00/);
    expect(hasKnownKickoffTime(known)).toBe(true);
    expect(formatKickoffTime(known)).toBe('19:00');
    expect(formatKickoffLabel(known)).toBe('27.09.2026 · 19:00');
  });
});
