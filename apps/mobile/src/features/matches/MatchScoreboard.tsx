import { StyleSheet, View } from 'react-native';
import { displaysScore, FIXTURE_STATUS_LABELS } from '@eskisehirspor/shared';
import { ClubCrest, PressableScale, TeamMark, Text } from '@/design';
import { colors, layout, spacing } from '@/design/tokens';
import { formatMatchDay, formatTime } from '@/lib/format';
import type { FixtureRecord } from './api';

function EmptyOpponent({ size }: { size: number }) {
  return (
    <View
      accessibilityLabel="Rakip henüz yok"
      style={[
        styles.emptyMark,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    />
  );
}

export function MatchScoreboard({
  fixture,
  kicker,
  cta,
  onPress,
  clockLabel,
}: {
  fixture: FixtureRecord | null;
  kicker: string;
  cta?: string;
  onPress?: () => void;
  clockLabel?: string | null;
}) {
  const showScore = fixture ? displaysScore(fixture.status) : false;
  const center = showScore && fixture
    ? `${fixture.home_score ?? '–'}–${fixture.away_score ?? '–'}`
    : fixture
      ? formatTime(fixture.kickoff_at)
      : null;

  const board = (
    <View style={styles.board}>
      <View style={styles.top}>
        <Text variant="overline" tone="accent">
          {kicker}
        </Text>
        <Text variant="overline" muted>
          {fixture ? FIXTURE_STATUS_LABELS[fixture.status] : 'Bekleniyor'}
        </Text>
      </View>
      <Text variant="caption" muted>
        {fixture
          ? [fixture.competition.name, fixture.round_label].filter(Boolean).join('  ·  ')
          : 'Resmi fikstür kaydı yok'}
      </Text>
      <View style={styles.teams}>
        <View style={styles.team}>
          {fixture ? (
            <TeamMark
              name={fixture.home_team.name}
              shortName={fixture.home_team.short_name}
              isClub={fixture.home_team.is_eskisehirspor}
              crestUri={fixture.home_team.crest_path}
              size="lg"
            />
          ) : (
            <ClubCrest size="lg" />
          )}
          <Text variant="overline" numberOfLines={2} style={styles.teamName}>
            {fixture ? fixture.home_team.short_name : 'Eskişehirspor'}
          </Text>
        </View>
        <View style={styles.center}>
          {center ? (
            <Text variant="score">{center}</Text>
          ) : (
            <Text variant="title" muted>
              — : —
            </Text>
          )}
          <Text variant="overline" muted>
            {clockLabel ?? (fixture ? (fixture.home_team.is_eskisehirspor ? 'İç saha' : 'Deplasman') : 'Saha')}
          </Text>
        </View>
        <View style={styles.team}>
          {fixture ? (
            <TeamMark
              name={fixture.away_team.name}
              shortName={fixture.away_team.short_name}
              isClub={fixture.away_team.is_eskisehirspor}
              crestUri={fixture.away_team.crest_path}
              size="lg"
            />
          ) : (
            <EmptyOpponent size={72} />
          )}
          <Text variant="overline" numberOfLines={2} muted={!fixture} style={styles.teamName}>
            {fixture ? fixture.away_team.short_name : 'Rakip'}
          </Text>
        </View>
      </View>
      <Text muted>
        {fixture
          ? [formatMatchDay(fixture.kickoff_at), fixture.venue?.name].filter(Boolean).join('  ·  ')
          : 'Tarih, saat ve stadyum resmi kayıtla gelir.'}
      </Text>
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
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={kicker}>
      {board}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  board: {
    marginHorizontal: -layout.gutter,
    paddingHorizontal: layout.gutter,
    paddingVertical: spacing.xl,
    backgroundColor: colors.charcoal,
    borderTopWidth: layout.stripe,
    borderTopColor: colors.red,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
    gap: spacing.md,
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
  },
  center: {
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 108,
  },
  emptyMark: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
});
