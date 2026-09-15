import { describe, expect, it } from 'vitest';
import { catalogKickoffIso } from '@eskisehirspor/shared';
import { formatKickoffLabel, formatKickoffTime } from './format';

describe('match kickoff formatting', () => {
  it('does not render 00:00 for unpublished clocks', () => {
    const iso = catalogKickoffIso('2026-09-27', null);
    expect(formatKickoffTime(iso)).toBeNull();
    expect(formatKickoffLabel(iso)).toBe('27.09.2026');
    expect(formatKickoffLabel(iso)).not.toContain('00:00');
  });
});
