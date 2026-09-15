import { StyleSheet, View } from 'react-native';
import { TeamMark, Text } from '@/design';
import { colors, spacing } from '@/design/tokens';
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
          POS
        </Text>
        <Text variant="caption" muted style={styles.teamHead}>
          TEAM
        </Text>
        <Text variant="caption" muted style={styles.stat}>
          P
        </Text>
        <Text variant="caption" muted style={styles.stat}>
          W
        </Text>
        <Text variant="caption" muted style={styles.stat}>
          D
        </Text>
        <Text variant="caption" muted style={styles.stat}>
          L
        </Text>
        <Text variant="caption" muted style={styles.gd}>
          GD
        </Text>
        <Text variant="caption" muted style={styles.pts}>
          PTS
        </Text>
      </View>
      {rows.map((row) => (
        <View key={row.team.id} style={[styles.row, row.team.is_eskisehirspor && styles.clubRow]}>
          <Text style={styles.pos}>{row.position}</Text>
          <View style={styles.team}>
            <TeamMark
              name={row.team.name}
              shortName={row.team.short_name}
              isClub={row.team.is_eskisehirspor}
              crestUri={row.team.crest_path}
              size="xs"
            />
            <Text numberOfLines={1} style={styles.teamName}>
              {row.team.short_name}
            </Text>
          </View>
          <Text style={styles.stat}>{row.played}</Text>
          <Text style={styles.stat}>{row.wins}</Text>
          <Text style={styles.stat}>{row.draws}</Text>
          <Text style={styles.stat}>{row.losses}</Text>
          <Text style={styles.gd}>{formatGd(row.goal_difference)}</Text>
          <Text style={styles.pts}>{row.points}</Text>
        </View>
      ))}
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
    minHeight: 44,
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
    width: 32,
    textAlign: 'center',
    fontSize: 11,
    letterSpacing: 0.4,
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
    fontSize: 13,
  },
  stat: {
    width: 22,
    textAlign: 'center',
    fontSize: 12,
  },
  gd: {
    width: 28,
    textAlign: 'center',
    fontSize: 12,
  },
  pts: {
    width: 32,
    textAlign: 'center',
    fontSize: 13,
  },
});
