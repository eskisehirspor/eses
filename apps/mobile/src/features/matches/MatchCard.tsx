import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { classifyFixtureStatus, displaysScore, FIXTURE_STATUS_LABELS } from '@eskisehirspor/shared';
import { ClubCrest, DateStamp, PressableScale, TeamMark, Text } from '@/design';
import { colors, spacing } from '@/design/tokens';
import { formatTime } from '@/lib/format';
import type { FixtureRecord } from './api';

export function MatchCard({ fixture, emphasizeScore = false }: { fixture: FixtureRecord; emphasizeScore?: boolean }) {
  const showScore = displaysScore(fixture.status);
  const live = classifyFixtureStatus(fixture.status) === 'live';
  const venueSide = fixture.home_team.is_eskisehirspor
    ? 'İç saha'
    : fixture.away_team.is_eskisehirspor
      ? 'Deplasman'
      : null;

  return (
    <PressableScale
      onPress={() => router.push(`/maclar/${fixture.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${fixture.home_team.name} ${fixture.away_team.name}`}
      style={styles.row}
    >
      <DateStamp iso={fixture.kickoff_at} />
      <View style={styles.body}>
        <Text variant="overline" muted>
          {fixture.competition.name}
          {live ? '  ·  CANLI' : ''}
        </Text>
        <View style={styles.teams}>
          <View style={styles.side}>
            <TeamMark
              name={fixture.home_team.name}
              shortName={fixture.home_team.short_name}
              isClub={fixture.home_team.is_eskisehirspor}
              crestUri={fixture.home_team.crest_path}
              size="sm"
            />
            <Text numberOfLines={1} style={styles.name}>
              {fixture.home_team.short_name}
            </Text>
          </View>
          <View style={styles.mid}>
            {showScore ? (
              <Text variant={emphasizeScore ? 'title' : 'subtitle'}>
                {fixture.home_score ?? '–'}–{fixture.away_score ?? '–'}
              </Text>
            ) : (
              <Text variant="caption" muted>
                {formatTime(fixture.kickoff_at)}
              </Text>
            )}
          </View>
          <View style={[styles.side, styles.away]}>
            <Text numberOfLines={1} style={[styles.name, styles.awayName]}>
              {fixture.away_team.short_name}
            </Text>
            <TeamMark
              name={fixture.away_team.name}
              shortName={fixture.away_team.short_name}
              isClub={fixture.away_team.is_eskisehirspor}
              crestUri={fixture.away_team.crest_path}
              size="sm"
            />
          </View>
        </View>
        <Text variant="caption" muted numberOfLines={1}>
          {[venueSide, fixture.venue?.name, FIXTURE_STATUS_LABELS[fixture.status]].filter(Boolean).join('  ·  ')}
        </Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  teams: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  side: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 0,
  },
  away: {
    justifyContent: 'flex-end',
  },
  name: {
    flex: 1,
    minWidth: 0,
  },
  awayName: {
    textAlign: 'right',
  },
  mid: {
    minWidth: 56,
    alignItems: 'center',
  },
  emptyCrest: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});

export function MatchRowPlaceholder({ mode }: { mode: 'upcoming' | 'result' }) {
  return (
    <View style={styles.row} accessibilityLabel="Fikstür bekleniyor">
      <DateStamp iso={null} />
      <View style={styles.body}>
        <Text variant="overline" muted>
          Fikstür
        </Text>
        <View style={styles.teams}>
          <View style={styles.side}>
            <ClubCrest size="sm" />
            <Text numberOfLines={1} style={styles.name}>
              ES ES
            </Text>
          </View>
          <View style={styles.mid}>
            <Text variant="caption" muted>
              {mode === 'result' ? '— : —' : 'Saat'}
            </Text>
          </View>
          <View style={[styles.side, styles.away]}>
            <Text numberOfLines={1} muted style={[styles.name, styles.awayName]}>
              Rakip
            </Text>
            <View style={styles.emptyCrest} />
          </View>
        </View>
        <Text variant="caption" muted>
          Stadyum kaydı yok
        </Text>
      </View>
    </View>
  );
}
