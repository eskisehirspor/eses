import { StyleSheet, View } from 'react-native';
import { displayTeamName } from '@eskisehirspor/shared';
import { TeamMark, Text } from '@/design';
import { colors, spacing, typography } from '@/design/tokens';
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
  return (
    <View style={styles.wrap}>
      <Text variant="caption" muted>
        {competitionLabel}
      </Text>
      <View style={styles.head}>
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
        return (
          <View key={row.team.id} style={[styles.row, row.team.is_eskisehirspor && styles.clubRow]}>
            <Text style={styles.pos}>{row.position}</Text>
            <View style={styles.team}>
              <TeamMark
                name={name}
                shortName={row.team.short_name}
                isClub={row.team.is_eskisehirspor}
                crestUri={row.team.crest_path}
                size="xs"
              />
              <Text numberOfLines={1} style={[styles.teamName, row.team.is_eskisehirspor && styles.clubName]}>
                {name}
              </Text>
            </View>
            <Text style={styles.stat}>{row.played}</Text>
            <Text style={styles.stat}>{row.wins}</Text>
            <Text style={styles.stat}>{row.draws}</Text>
            <Text style={styles.stat}>{row.losses}</Text>
            <Text style={styles.gd}>{formatGd(row.goal_difference)}</Text>
            <Text style={styles.pts}>{row.points}</Text>
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
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    gap: 2,
  },
  clubRow: {
    backgroundColor: colors.redSoft,
    borderLeftWidth: 2,
    borderLeftColor: colors.red,
    paddingLeft: 6,
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
