import { StyleSheet, View } from 'react-native';
import { classifyFixtureStatus, displayTeamName, displaysScore, FIXTURE_STATUS_LABELS } from '@eskisehirspor/shared';
import { ClubCrest, DateStamp, PressableScale, TeamMark, Text } from '@/design';
import { spacing, typography } from '@/design/tokens';
import { useColors } from '@/design/theme-context';
import { formatKickoffTime } from '@/lib/format';
import { router } from 'expo-router';
import type { FixtureRecord } from './api';
import { AwayTripChip } from './AwayTripSheet';
import { fixtureAwayTrip } from './away-trip';

export function MatchCard({
  fixture,
  emphasizeScore = false,
  featured = false,
  compact = false,
}: {
  fixture: FixtureRecord;
  emphasizeScore?: boolean;
  featured?: boolean;
  compact?: boolean;
}) {
  const colors = useColors();
  const showScore = displaysScore(fixture.status);
  const live = classifyFixtureStatus(fixture.status) === 'live';
  const clubMatch = fixture.home_team.is_eskisehirspor || fixture.away_team.is_eskisehirspor;
  const clubHome = fixture.home_team.is_eskisehirspor;
  const clubAway = fixture.away_team.is_eskisehirspor;
  const homeName = displayTeamName(fixture.home_team);
  const awayName = displayTeamName(fixture.away_team);
  const kickoffTime = formatKickoffTime(fixture.kickoff_at);
  const awayTrip = fixtureAwayTrip(fixture);
  const statusLabel = live ? 'Canlı' : FIXTURE_STATUS_LABELS[fixture.status];
  const venueLabel = clubHome ? 'Ev sahibi' : clubAway ? 'Deplasman' : null;
  const meta = [
    venueLabel,
    fixture.round_label,
    compact ? null : fixture.competition.name,
    showScore ? null : kickoffTime,
    compact ? statusLabel : null,
  ].filter(Boolean);

  const treatmentStyle =
    clubHome && !compact
      ? { backgroundColor: colors.homeTreatment, borderLeftColor: colors.red, borderLeftWidth: 3 }
      : clubAway && !compact
        ? { backgroundColor: colors.awayTreatment, borderLeftColor: colors.border, borderLeftWidth: 3 }
        : featured
          ? { borderLeftColor: colors.red, borderLeftWidth: 2 }
          : null;

  return (
    <View
      style={[
        {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.borderSubtle,
          paddingLeft: treatmentStyle ? spacing.sm : 0,
          marginLeft: treatmentStyle ? -spacing.sm : 0,
        },
        treatmentStyle,
        compact ? { opacity: 0.92 } : null,
      ]}
    >
      <PressableScale
        onPress={() => router.push(`/maclar/${fixture.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`${homeName} ${awayName}${venueLabel ? ` ${venueLabel}` : ''}${kickoffTime ? ` ${kickoffTime}` : ''}`}
        style={styles.row}
      >
        <DateStamp iso={fixture.kickoff_at} />
        <View style={styles.body}>
          <Text variant="caption" muted numberOfLines={1}>
            {featured ? 'Sıradaki  ·  ' : ''}
            {meta.join('  ·  ')}
            {live && !compact ? '  ·  Canlı' : ''}
          </Text>
          <View style={styles.teamRow}>
            <TeamMark
              name={homeName}
              shortName={fixture.home_team.short_name}
              isClub={fixture.home_team.is_eskisehirspor}
              crestUri={fixture.home_team.crest_path}
              size={fixture.home_team.is_eskisehirspor ? 'md' : 'sm'}
            />
            <Text
              numberOfLines={1}
              style={[
                styles.name,
                { color: colors.text },
                fixture.home_team.is_eskisehirspor && styles.clubName,
                compact && !clubMatch && { color: colors.textSecondary },
              ]}
            >
              {homeName}
            </Text>
            {showScore ? (
              <Text style={[styles.result, { color: colors.text }, emphasizeScore && styles.resultStrong]}>
                {fixture.home_score ?? '–'}
              </Text>
            ) : null}
          </View>
          <View style={styles.teamRow}>
            <TeamMark
              name={awayName}
              shortName={fixture.away_team.short_name}
              isClub={fixture.away_team.is_eskisehirspor}
              crestUri={fixture.away_team.crest_path}
              size={fixture.away_team.is_eskisehirspor ? 'md' : 'sm'}
            />
            <Text
              numberOfLines={1}
              style={[
                styles.name,
                { color: colors.text },
                fixture.away_team.is_eskisehirspor && styles.clubName,
                compact && !clubMatch && { color: colors.textSecondary },
              ]}
            >
              {awayName}
            </Text>
            {showScore ? (
              <Text style={[styles.result, { color: colors.text }, emphasizeScore && styles.resultStrong]}>
                {fixture.away_score ?? '–'}
              </Text>
            ) : (
              <Text variant="caption" muted style={styles.status}>
                {compact ? null : statusLabel}
              </Text>
            )}
          </View>
        </View>
      </PressableScale>
      {awayTrip ? <AwayTripChip fixture={fixture} trip={awayTrip} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 72,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    justifyContent: 'center',
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
    minHeight: 36,
  },
  name: {
    flex: 1,
    minWidth: 0,
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md,
    fontWeight: typography.weight.medium,
  },
  clubName: {
    fontWeight: typography.weight.bold,
  },
  result: {
    minWidth: 28,
    textAlign: 'right',
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    fontWeight: typography.weight.semibold,
    fontVariant: ['tabular-nums'],
  },
  resultStrong: {
    fontWeight: typography.weight.bold,
  },
  status: {
    textAlign: 'right',
  },
  emptyCrest: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
});

export function MatchRowPlaceholder({ mode }: { mode: 'upcoming' | 'result' }) {
  const colors = useColors();
  return (
    <View style={{ borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSubtle }} accessibilityLabel="Fikstür bekleniyor">
      <View style={styles.row}>
        <DateStamp iso={null} />
        <View style={styles.body}>
          <Text variant="caption" muted>
            Fikstür
          </Text>
          <View style={styles.teamRow}>
            <ClubCrest size="md" />
            <Text numberOfLines={1} style={[styles.name, styles.clubName, { color: colors.text }]}>
              Eskişehirspor
            </Text>
          </View>
          <View style={styles.teamRow}>
            <View style={[styles.emptyCrest, { borderColor: colors.border }]} />
            <Text numberOfLines={1} muted style={styles.name}>
              Rakip
            </Text>
            <Text variant="caption" muted>
              {mode === 'result' ? '—' : 'Saat'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
