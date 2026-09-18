import { StyleSheet, View } from 'react-native';
import { displayTeamName } from '@eskisehirspor/shared';
import { TeamMark, Text } from '@/design';
import { spacing, typography } from '@/design/tokens';
import { useColors } from '@/design/theme-context';
import type { StandingRecord } from './api';

function formatGd(value: number) {
  if (value > 0) {
    return `+${value}`;
  }
  return String(value);
}

export function StandingsTable({
  rows,
  competitionLabel,
}: {
  rows: StandingRecord[];
  competitionLabel: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.wrap}>
      <Text variant="caption" muted numberOfLines={1} style={styles.competitionLabel}>
        {competitionLabel}
      </Text>
      <View style={[styles.head, { borderBottomColor: colors.border }]}>
        <Text variant="caption" muted style={styles.pos}>
          #
        </Text>
        <Text variant="caption" muted style={styles.teamHead}>
          Takım
        </Text>
        <Text variant="caption" muted style={styles.stat}>
          O
        </Text>
        <Text variant="caption" muted style={styles.stat}>
          G
        </Text>
        <Text variant="caption" muted style={styles.stat}>
          B
        </Text>
        <Text variant="caption" muted style={styles.stat}>
          M
        </Text>
        <Text variant="caption" muted style={styles.gd}>
          AV
        </Text>
        <Text variant="caption" muted style={styles.pts}>
          P
        </Text>
      </View>
      {rows.map((row) => {
        const name = displayTeamName(row.team);
        const isClub = row.team.is_eskisehirspor;
        return (
          <View
            key={row.team.id}
            style={[
              styles.row,
              isClub && [styles.clubRow, { backgroundColor: colors.redSoft, borderLeftColor: colors.red }],
            ]}
          >
            <Text style={[styles.pos, { color: colors.text }]}>{row.position}</Text>
            <View style={styles.team}>
              <TeamMark
                name={name}
                shortName={row.team.short_name}
                isClub={isClub}
                crestUri={row.team.crest_path}
                size="xs"
              />
              <Text
                numberOfLines={1}
                style={[styles.teamName, { color: colors.text }, isClub && [styles.clubName, { color: colors.red }]]}
              >
                {name}
              </Text>
            </View>
            <Text style={[styles.stat, { color: colors.text }]}>{row.played}</Text>
            <Text style={[styles.stat, { color: colors.text }]}>{row.wins}</Text>
            <Text style={[styles.stat, { color: colors.text }]}>{row.draws}</Text>
            <Text style={[styles.stat, { color: colors.text }]}>{row.losses}</Text>
            <Text style={[styles.gd, { color: colors.text }]}>{formatGd(row.goal_difference)}</Text>
            <Text style={[styles.pts, { color: colors.text }]}>{row.points}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  competitionLabel: {
    textAlign: 'center',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    gap: 2,
  },
  clubRow: {
    borderLeftWidth: 3,
    paddingLeft: 5,
    marginLeft: -8,
  },
  pos: {
    width: 28,
    textAlign: 'center',
    fontSize: typography.size.xs,
    fontVariant: ['tabular-nums'],
  },
  teamHead: {
    flex: 1,
  },
  team: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 0,
  },
  teamName: {
    flex: 1,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  clubName: {
    fontWeight: typography.weight.bold,
  },
  stat: {
    width: 24,
    textAlign: 'center',
    fontSize: typography.size.xs,
    fontVariant: ['tabular-nums'],
  },
  gd: {
    width: 32,
    textAlign: 'center',
    fontSize: typography.size.xs,
    fontVariant: ['tabular-nums'],
  },
  pts: {
    width: 32,
    textAlign: 'center',
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    fontVariant: ['tabular-nums'],
  },
});
