import { StyleSheet, View } from 'react-native';
import { displayTeamName, displaysScore, FIXTURE_STATUS_LABELS, formatKickoffLabel, formatKickoffTime } from '@eskisehirspor/shared';
import { ClubCrest, PressableScale, TeamMark, Text } from '@/design';
import { layout, spacing, typography } from '@/design/tokens';
import { useColors } from '@/design/theme-context';
import type { FixtureRecord } from './api';

function EmptyOpponent({ size, borderColor }: { size: number; borderColor: string }) {
  return (
    <View
      accessibilityLabel="Rakip henüz yok"
      style={[
        styles.emptyMark,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor,
        },
      ]}
    />
  );
}

/** A scheduled match has no status worth announcing — never renders "Planlandı". */
function statusWordFor(fixture: FixtureRecord | null): string | null {
  if (!fixture || fixture.status === 'scheduled') {
    return null;
  }
  return FIXTURE_STATUS_LABELS[fixture.status];
}

export function MatchScoreboard({
  fixture,
  kicker,
  cta,
  onPress,
  clockLabel,
  hideKickoffSummary = false,
  compact = false,
}: {
  fixture: FixtureRecord | null;
  kicker: string;
  cta?: string;
  onPress?: () => void;
  clockLabel?: string | null;
  /** Match Detail shows date/venue in its own "Maç bilgisi" section — skip this line there to avoid duplication. */
  hideKickoffSummary?: boolean;
  /** Home's hero uses this for a more balanced, less flat-and-wide composition. Match Detail leaves this off. */
  compact?: boolean;
}) {
  const colors = useColors();
  const showScore = fixture ? displaysScore(fixture.status) : false;
  const homeName = fixture ? displayTeamName(fixture.home_team) : 'Eskişehirspor';
  const awayName = fixture ? displayTeamName(fixture.away_team) : 'Rakip';
  const statusWord = statusWordFor(fixture);
  const crestSize = compact ? 'md' : 'lg';
  const emptyOpponentSize = compact ? 40 : 80;
  const center = showScore && fixture
    ? `${fixture.home_score ?? '–'}–${fixture.away_score ?? '–'}`
    : fixture
      ? formatKickoffTime(fixture.kickoff_at)
      : null;

  const board = (
    <View
      style={[
        styles.board,
        compact && styles.boardCompact,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.red,
          borderBottomColor: colors.borderSubtle,
        },
      ]}
    >
      <View style={styles.top}>
        <Text variant="caption" tone="accent">
          {kicker}
        </Text>
        {statusWord ? (
          <Text variant="caption" muted>
            {statusWord}
          </Text>
        ) : null}
      </View>
      <Text variant="body" muted numberOfLines={1} style={styles.competition}>
        {fixture
          ? [fixture.competition.name, fixture.round_label].filter(Boolean).join('  ·  ')
          : 'Resmi fikstür kaydı yok'}
      </Text>
      <View style={styles.teams}>
        <View style={styles.team}>
          {fixture ? (
            <TeamMark
              name={homeName}
              shortName={fixture.home_team.short_name}
              isClub={fixture.home_team.is_eskisehirspor}
              crestUri={fixture.home_team.crest_path}
              size={crestSize}
            />
          ) : (
            <ClubCrest size={crestSize} />
          )}
          <Text
            numberOfLines={2}
            style={[styles.teamName, fixture?.home_team.is_eskisehirspor && styles.clubName]}
          >
            {homeName}
          </Text>
        </View>
        <View style={styles.center}>
          {center ? (
            <Text variant="score">{center}</Text>
          ) : (
            <Text variant="title" muted>
              —
            </Text>
          )}
          <Text variant="caption" muted>
            {clockLabel ?? (fixture ? (fixture.home_team.is_eskisehirspor ? 'İç saha' : 'Deplasman') : 'Saha')}
          </Text>
        </View>
        <View style={styles.team}>
          {fixture ? (
            <TeamMark
              name={awayName}
              shortName={fixture.away_team.short_name}
              isClub={fixture.away_team.is_eskisehirspor}
              crestUri={fixture.away_team.crest_path}
              size={crestSize}
            />
          ) : (
            <EmptyOpponent size={emptyOpponentSize} borderColor={colors.border} />
          )}
          <Text
            numberOfLines={2}
            muted={!fixture}
            style={[styles.teamName, fixture?.away_team.is_eskisehirspor && styles.clubName]}
          >
            {awayName}
          </Text>
        </View>
      </View>
      {hideKickoffSummary ? null : (
        <Text>
          {fixture
            ? [formatKickoffLabel(fixture.kickoff_at), fixture.venue?.name].filter(Boolean).join('  ·  ')
            : 'Tarih ve stadyum resmi kayıtla gelir.'}
        </Text>
      )}
      {cta ? (
        <Text variant="caption" tone="accent">
          {cta}
        </Text>
      ) : null}
    </View>
  );

  if (!onPress) {
    return board;
  }

  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={`${kicker}. ${homeName} ${awayName}`}>
      {board}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  board: {
    marginHorizontal: -layout.gutter,
    paddingHorizontal: layout.gutter,
    paddingVertical: spacing.xl,
    borderTopWidth: layout.stripe,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  boardCompact: {
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  competition: {
    textAlign: 'center',
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    fontWeight: typography.weight.semibold,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  teams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  team: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  teamName: {
    textAlign: 'center',
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.medium,
  },
  clubName: {
    fontWeight: typography.weight.bold,
  },
  center: {
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 108,
  },
  emptyMark: {
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'transparent',
  },
});
