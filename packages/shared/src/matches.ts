import { z } from 'zod';

export const FIXTURE_STATUSES = [
  'scheduled',
  'live',
  'halftime',
  'finished',
  'postponed',
  'cancelled',
] as const;

export const TEAM_CRESTS_BUCKET = 'team-crests';

export const FixtureStatusSchema = z.enum(FIXTURE_STATUSES);
export type FixtureStatus = z.infer<typeof FixtureStatusSchema>;

export const FIXTURE_STATUS_LABELS: Record<FixtureStatus, string> = {
  scheduled: 'Planlandı',
  live: 'Canlı',
  halftime: 'Devre arası',
  finished: 'Bitti',
  postponed: 'Ertelendi',
  cancelled: 'İptal',
};

export type FixtureClassification = 'upcoming' | 'live' | 'completed' | 'inactive';

export function classifyFixtureStatus(status: FixtureStatus): FixtureClassification {
  switch (status) {
    case 'scheduled':
      return 'upcoming';
    case 'live':
    case 'halftime':
      return 'live';
    case 'finished':
      return 'completed';
    case 'postponed':
    case 'cancelled':
      return 'inactive';
  }
}

export function isUpcomingFixture(status: FixtureStatus): boolean {
  return classifyFixtureStatus(status) === 'upcoming';
}

export function isCompletedFixture(status: FixtureStatus): boolean {
  return classifyFixtureStatus(status) === 'completed';
}

export function isInactiveFixture(status: FixtureStatus): boolean {
  return classifyFixtureStatus(status) === 'inactive';
}

export function displaysScore(status: FixtureStatus): boolean {
  return status === 'finished' || status === 'live' || status === 'halftime';
}

export const CLUB_DISPLAY_NAME = 'Eskişehirspor';

export function displayTeamName(team: {
  name: string;
  short_name?: string | null;
  is_eskisehirspor?: boolean;
}): string {
  if (team.is_eskisehirspor) {
    return CLUB_DISPLAY_NAME;
  }
  const label = team.name.trim() || (team.short_name ?? '').trim();
  if (label === 'ES ES') {
    return CLUB_DISPLAY_NAME;
  }
  return label;
}

export const StandingRowSchema = z.object({
  competition_id: z.string().uuid(),
  team_id: z.string().uuid(),
  position: z.number().int().min(1),
  played: z.number().int().min(0),
  wins: z.number().int().min(0),
  draws: z.number().int().min(0),
  losses: z.number().int().min(0),
  goals_for: z.number().int().min(0),
  goals_against: z.number().int().min(0),
  points: z.number().int().min(0),
});

export type StandingRowInput = z.infer<typeof StandingRowSchema>;

export function standingGoalDifference(row: Pick<StandingRowInput, 'goals_for' | 'goals_against'>): number {
  return row.goals_for - row.goals_against;
}

export function isValidStandingRow(row: StandingRowInput): boolean {
  const parsed = StandingRowSchema.safeParse(row);
  if (!parsed.success) {
    return false;
  }
  return parsed.data.played === parsed.data.wins + parsed.data.draws + parsed.data.losses;
}
