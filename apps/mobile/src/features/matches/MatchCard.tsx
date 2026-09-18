import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { classifyFixtureStatus, displayTeamName, displaysScore, FIXTURE_STATUS_LABELS } from '@eskisehirspor/shared';
import { Badge, ClubCrest, PressableScale, TeamMark, Text } from '@/design';
import { iconSize, radii, spacing, typography } from '@/design/tokens';
import { useColors } from '@/design/theme-context';
import { formatKickoffTime } from '@/lib/format';
import type { FixtureRecord } from './api';
import { fixtureAwayTrip } from './away-trip';

/** "19 EYLÜL · CUMARTESİ" style header. Europe/Istanbul, same source as the kickoff timestamp. */
function formatMatchDayHeader(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  const day = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', timeZone: 'Europe/Istanbul' }).format(date);
  const month = new Intl.DateTimeFormat('tr-TR', { month: 'long', timeZone: 'Europe/Istanbul' })
    .format(date)
    .toLocaleUpperCase('tr-TR');
  const weekday = new Intl.DateTimeFormat('tr-TR', { weekday: 'long', timeZone: 'Europe/Istanbul' })
    .format(date)
    .toLocaleUpperCase('tr-TR');
  return `${day} ${month} · ${weekday}`;
}

/** Compact "20.09" style date for the tight Fikstür row. */
function formatCompactDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  const day = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', timeZone: 'Europe/Istanbul' }).format(date);
  const month = new Intl.DateTimeFormat('tr-TR', { month: '2-digit', timeZone: 'Europe/Istanbul' }).format(date);
  return `${day}.${month}`;
}

function anomalyLabelFor(fixture: FixtureRecord): string | null {
  return fixture.status === 'postponed' || fixture.status === 'cancelled' ? FIXTURE_STATUS_LABELS[fixture.status] : null;
}

/** Fixed white-on-red text tones — the home card's red surface must stay legible in both Light and Dark mode. */
const ON_RED = { primary: '#FFFFFF', secondary: 'rgba(255,255,255,0.78)' };

/**
 * Yaklaşan card — Eskişehirspor's own upcoming fixtures only. Opponent is
 * always on the left, the club always on the right, so the club's identity
 * position never moves regardless of home/away. Home fixtures get a strong
 * club-red surface; away fixtures get a charcoal surface — so the app no
 * longer makes every upcoming match look like an away match.
 */
export function UpcomingMatchCard({ fixture, featured = false }: { fixture: FixtureRecord; featured?: boolean }) {
  const colors = useColors();
  const showScore = displaysScore(fixture.status);
  const live = classifyFixtureStatus(fixture.status) === 'live';
  const clubHome = fixture.home_team.is_eskisehirspor;
  const clubAway = fixture.away_team.is_eskisehirspor;
  const clubTeam = clubHome ? fixture.home_team : fixture.away_team;
  const opponentTeam = clubHome ? fixture.away_team : fixture.home_team;
  const clubName = displayTeamName(clubTeam);
  const opponentName = displayTeamName(opponentTeam);
  const kickoffTime = formatKickoffTime(fixture.kickoff_at);
  const anomalyLabel = anomalyLabelFor(fixture);
  const awayTrip = clubAway ? fixtureAwayTrip(fixture) : null;
  const venueName = fixture.venue?.name ?? awayTrip?.stadiumName ?? null;

  const primaryColor = clubHome ? ON_RED.primary : colors.text;
  const secondaryColor = clubHome ? ON_RED.secondary : colors.textMuted;

  return (
    <View
      style={[
        styles.upcomingWrap,
        clubHome
          ? { backgroundColor: colors.red }
          : { backgroundColor: colors.surfaceRaised, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
      ]}
    >
      <PressableScale
        onPress={() => router.push(`/maclar/${fixture.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`Eskişehirspor - ${opponentName}${kickoffTime ? ` ${kickoffTime}` : ''}`}
        style={[styles.upcomingCard, featured && styles.upcomingCardFeatured]}
      >
        {featured ? (
          <Text
            variant="overline"
            numberOfLines={1}
            style={[styles.eyebrow, { color: clubHome ? ON_RED.secondary : colors.red }]}
          >
            SIRADAKİ MAÇ
          </Text>
        ) : null}

        <View style={styles.upcomingRow}>
          <View style={styles.upcomingSide}>
            <TeamMark
              name={opponentName}
              shortName={opponentTeam.short_name}
              isClub={false}
              crestUri={opponentTeam.crest_path}
              size="sm"
            />
            <Text numberOfLines={2} style={[styles.upcomingName, { color: secondaryColor }]}>
              {opponentName}
            </Text>
          </View>

          <View style={styles.upcomingCenter}>
            <Text variant="caption" numberOfLines={1} style={{ color: secondaryColor }}>
              {formatMatchDayHeader(fixture.kickoff_at)}
            </Text>
            {live ? (
              <Badge label="CANLI" tone="live" />
            ) : anomalyLabel ? (
              <Text variant="caption" numberOfLines={1} style={{ color: secondaryColor }}>
                {anomalyLabel}
              </Text>
            ) : showScore ? (
              <Text style={[styles.upcomingScore, { color: primaryColor }]}>
                {fixture.home_score ?? '–'}–{fixture.away_score ?? '–'}
              </Text>
            ) : (
              <Text style={[styles.upcomingTime, { color: primaryColor }, featured && styles.upcomingTimeFeatured]}>
                {kickoffTime ?? '—'}
              </Text>
            )}
            {venueName ? (
              <Text variant="caption" numberOfLines={1} style={{ color: secondaryColor }}>
                {venueName}
              </Text>
            ) : null}
            {clubAway && awayTrip?.approxRoadKm != null ? (
              <View style={styles.footerRow}>
                <Ionicons name="airplane-outline" size={iconSize.sm} color={secondaryColor} accessibilityLabel="Deplasman maçı" />
                <Text variant="caption" style={{ color: secondaryColor }}>
                  ~{awayTrip.approxRoadKm} km
                </Text>
              </View>
            ) : clubAway ? (
              <Ionicons name="airplane-outline" size={iconSize.sm} color={secondaryColor} accessibilityLabel="Deplasman maçı" />
            ) : null}
          </View>

          <View style={styles.upcomingSide}>
            <TeamMark
              name={clubName}
              shortName={clubTeam.short_name}
              isClub
              crestUri={clubTeam.crest_path}
              size="md"
            />
            <Text numberOfLines={2} style={[styles.upcomingName, styles.clubName, { color: primaryColor }]}>
              {clubName}
            </Text>
          </View>
        </View>
      </PressableScale>
    </View>
  );
}

const FIXTURE_TEAM_COL_WIDTH = 126;
const FIXTURE_CENTER_COL_WIDTH = 48;
const FIXTURE_PLANE_COL_WIDTH = 16;
const FIXTURE_MARKER_WIDTH = 3;
const FIXTURE_CREST_SLOT_WIDTH = 32;
const FIXTURE_SLOT_GAP = 6;

/**
 * Fikstür row — every fixture, any club, one compact horizontal line. Every
 * column is a fixed pixel width (not flex-derived) and the crest sits at the
 * column's outer edge, so a short or long team name can never move the crest,
 * the center time/score, or the plane column. Eskişehirspor's row gets a thin
 * absolutely-positioned red edge marker — never a text underline — so it adds
 * zero layout weight.
 */
export function FixtureRow({ fixture }: { fixture: FixtureRecord }) {
  const colors = useColors();
  const showScore = displaysScore(fixture.status);
  const live = classifyFixtureStatus(fixture.status) === 'live';
  const clubHome = fixture.home_team.is_eskisehirspor;
  const clubAway = fixture.away_team.is_eskisehirspor;
  const homeName = displayTeamName(fixture.home_team);
  const awayName = displayTeamName(fixture.away_team);
  const kickoffTime = formatKickoffTime(fixture.kickoff_at);
  const anomalyLabel = anomalyLabelFor(fixture);
  const isClubFixture = clubHome || clubAway;

  return (
    <View
      style={[styles.fixtureOuter, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSubtle }]}
    >
      {isClubFixture ? <View style={[styles.fixtureClubMarker, { backgroundColor: colors.red }]} /> : null}
      <PressableScale
        onPress={() => router.push(`/maclar/${fixture.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`${homeName} - ${awayName}${kickoffTime ? ` ${kickoffTime}` : ''}`}
        style={styles.fixtureRow}
      >
        <View style={[styles.fixtureTeamCol, { width: FIXTURE_TEAM_COL_WIDTH }]}>
          <View style={styles.fixtureCrestSlot}>
            <TeamMark name={homeName} shortName={fixture.home_team.short_name} isClub={clubHome} crestUri={fixture.home_team.crest_path} size="xs" />
          </View>
          <View style={styles.fixtureNameSlot}>
            <Text
              numberOfLines={1}
              style={[
                styles.fixtureName,
                { color: clubHome ? colors.text : colors.textSecondary },
                clubHome && styles.clubName,
              ]}
            >
              {homeName}
            </Text>
          </View>
        </View>

        <View style={[styles.fixtureCenterCol, { width: FIXTURE_CENTER_COL_WIDTH }]}>
          <Text variant="caption" muted numberOfLines={1}>
            {formatCompactDate(fixture.kickoff_at)}
          </Text>
          {live ? (
            <Badge label="CANLI" tone="live" />
          ) : anomalyLabel ? (
            <Text variant="caption" muted numberOfLines={1}>
              {anomalyLabel}
            </Text>
          ) : showScore ? (
            <Text numberOfLines={1} style={[styles.fixtureScore, { color: colors.text }]}>
              {fixture.home_score ?? '–'}–{fixture.away_score ?? '–'}
            </Text>
          ) : (
            <Text numberOfLines={1} style={[styles.fixtureTime, { color: kickoffTime ? colors.text : colors.textMuted }]}>
              {kickoffTime ?? '—'}
            </Text>
          )}
        </View>

        <View style={[styles.fixtureTeamCol, { width: FIXTURE_TEAM_COL_WIDTH }]}>
          <View style={styles.fixtureNameSlot}>
            <Text
              numberOfLines={1}
              style={[
                styles.fixtureName,
                { color: clubAway ? colors.text : colors.textSecondary },
                clubAway && styles.clubName,
              ]}
            >
              {awayName}
            </Text>
          </View>
          <View style={styles.fixtureCrestSlot}>
            <TeamMark name={awayName} shortName={fixture.away_team.short_name} isClub={clubAway} crestUri={fixture.away_team.crest_path} size="xs" />
          </View>
        </View>

        <View style={[styles.fixturePlaneCol, { width: FIXTURE_PLANE_COL_WIDTH }]}>
          {clubAway ? (
            <Ionicons name="airplane-outline" size={iconSize.sm} color={colors.textMuted} accessibilityLabel="Deplasman maçı" />
          ) : null}
        </View>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  // Yaklaşan
  upcomingWrap: {
    borderRadius: radii.lg,
    marginBottom: spacing.sm,
  },
  upcomingCard: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  upcomingCardFeatured: {
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  dateLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyebrow: {
    alignSelf: 'center',
    letterSpacing: typography.tracking.overline,
  },
  dateBadge: {
    borderRadius: radii.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  upcomingSide: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  upcomingCenter: {
    minWidth: 68,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  upcomingName: {
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.medium,
    textAlign: 'center',
    width: '100%',
  },
  upcomingScore: {
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    fontWeight: typography.weight.bold,
    fontVariant: ['tabular-nums'],
  },
  upcomingTime: {
    fontSize: typography.size.xl,
    lineHeight: typography.lineHeight.xl,
    fontWeight: typography.weight.bold,
    fontVariant: ['tabular-nums'],
  },
  upcomingTimeFeatured: {
    fontSize: typography.size.display,
    lineHeight: typography.lineHeight.display,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
  },
  clubName: {
    fontWeight: typography.weight.bold,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timeDot: {
    width: 5,
    height: 5,
    borderRadius: radii.full,
  },

  // Fikstür
  fixtureOuter: {
    position: 'relative',
  },
  fixtureClubMarker: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: FIXTURE_MARKER_WIDTH,
    borderRadius: FIXTURE_MARKER_WIDTH / 2,
  },
  fixtureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    paddingVertical: spacing.xxs,
    paddingLeft: FIXTURE_MARKER_WIDTH + spacing.xs,
  },
  fixtureTeamCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: FIXTURE_SLOT_GAP,
  },
  fixtureCrestSlot: {
    width: FIXTURE_CREST_SLOT_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixtureNameSlot: {
    width: FIXTURE_TEAM_COL_WIDTH - FIXTURE_CREST_SLOT_WIDTH - FIXTURE_SLOT_GAP,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixtureCenterCol: {
    alignItems: 'center',
    gap: 1,
  },
  fixturePlaneCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixtureName: {
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.weight.medium,
    textAlign: 'center',
  },
  fixtureScore: {
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.bold,
    fontVariant: ['tabular-nums'],
  },
  fixtureTime: {
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.semibold,
    fontVariant: ['tabular-nums'],
  },
  emptyCrest: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
});

export function UpcomingRowPlaceholder() {
  const colors = useColors();
  return (
    <View
      style={[styles.upcomingWrap, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSubtle }]}
      accessibilityLabel="Yaklaşan maç bekleniyor"
    >
      <View style={styles.upcomingCard}>
        <Text variant="caption" muted>
          Fikstür
        </Text>
        <View style={styles.upcomingRow}>
          <View style={styles.upcomingSide}>
            <View style={[styles.emptyCrest, { borderColor: colors.border }]} />
            <Text numberOfLines={1} muted style={styles.upcomingName}>
              Rakip
            </Text>
          </View>
          <View style={styles.upcomingCenter}>
            <Text variant="caption" muted>
              Saat
            </Text>
          </View>
          <View style={styles.upcomingSide}>
            <ClubCrest size="sm" />
            <Text numberOfLines={1} style={[styles.upcomingName, styles.clubName, { color: colors.text }]}>
              Eskişehirspor
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

/**
 * Generic single-row match card (home name — score/time — away name), kept
 * for HomeScreen's "Son maç" card — unrelated to the Matches redesign, so its
 * layout stays exactly as it was rather than being folded into the new
 * Yaklaşan/Fikstür presentations.
 */
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
  const clubHome = fixture.home_team.is_eskisehirspor;
  const clubAway = fixture.away_team.is_eskisehirspor;
  const homeName = displayTeamName(fixture.home_team);
  const awayName = displayTeamName(fixture.away_team);
  const kickoffTime = formatKickoffTime(fixture.kickoff_at);
  const anomalyLabel = anomalyLabelFor(fixture);
  const crestSize = compact ? 'xs' : 'sm';

  return (
    <View
      style={[
        legacyStyles.wrap,
        { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSubtle },
        compact ? legacyStyles.compact : null,
      ]}
    >
      <PressableScale
        onPress={() => router.push(`/maclar/${fixture.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`${homeName} - ${awayName}${kickoffTime ? ` ${kickoffTime}` : ''}`}
        style={legacyStyles.card}
      >
        <View style={styles.dateLine}>
          {featured ? (
            <Text variant="overline" tone="accent" style={styles.eyebrow}>
              SIRADAKİ MAÇ ·{' '}
            </Text>
          ) : null}
          <Text
            variant="caption"
            muted={!featured}
            tone={featured ? 'accent' : 'default'}
            numberOfLines={1}
            style={featured ? [styles.dateBadge, { backgroundColor: colors.redSoft }] : undefined}
          >
            {formatMatchDayHeader(fixture.kickoff_at)}
          </Text>
        </View>

        <View style={legacyStyles.matchRow}>
          <View style={legacyStyles.teams}>
            <TeamMark
              name={homeName}
              shortName={fixture.home_team.short_name}
              isClub={clubHome}
              crestUri={fixture.home_team.crest_path}
              size={crestSize}
            />
            <Text
              numberOfLines={1}
              style={[
                legacyStyles.name,
                { color: clubHome ? colors.text : colors.textSecondary },
                clubHome && styles.clubName,
              ]}
            >
              {homeName}
            </Text>
            <Text variant="caption" muted style={legacyStyles.sep}>
              {showScore ? `${fixture.home_score ?? '–'}–${fixture.away_score ?? '–'}` : '—'}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                legacyStyles.name,
                legacyStyles.nameAway,
                { color: clubAway ? colors.text : colors.textSecondary },
                clubAway && styles.clubName,
              ]}
            >
              {awayName}
            </Text>
            <TeamMark
              name={awayName}
              shortName={fixture.away_team.short_name}
              isClub={clubAway}
              crestUri={fixture.away_team.crest_path}
              size={crestSize}
            />
          </View>

          <View style={legacyStyles.trailing}>
            {live ? (
              <Badge label="CANLI" tone="live" />
            ) : anomalyLabel ? (
              <Text variant="caption" muted numberOfLines={1}>
                {anomalyLabel}
              </Text>
            ) : showScore ? null : kickoffTime ? (
              <View style={styles.timeRow}>
                <View style={[styles.timeDot, { backgroundColor: colors.red }]} />
                <Text
                  numberOfLines={1}
                  style={[legacyStyles.time, { color: colors.text }, emphasizeScore && legacyStyles.timeStrong]}
                >
                  {kickoffTime}
                </Text>
              </View>
            ) : (
              <Text muted style={legacyStyles.time}>
                —
              </Text>
            )}
            {clubAway ? (
              <Ionicons
                name="airplane-outline"
                size={iconSize.sm}
                color={colors.textMuted}
                style={legacyStyles.plane}
                accessibilityLabel="Deplasman maçı"
              />
            ) : null}
          </View>
        </View>
      </PressableScale>
    </View>
  );
}

const legacyStyles = StyleSheet.create({
  wrap: {
    paddingVertical: spacing.sm,
  },
  compact: {
    opacity: 0.9,
  },
  card: {
    gap: spacing.xxs,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
  },
  teams: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 0,
  },
  name: {
    flexShrink: 1,
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md,
    fontWeight: typography.weight.medium,
  },
  nameAway: {
    textAlign: 'right',
  },
  sep: {
    paddingHorizontal: 2,
  },
  trailing: {
    alignItems: 'flex-end',
    gap: 2,
    minWidth: 52,
  },
  time: {
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.semibold,
    fontVariant: ['tabular-nums'],
  },
  timeStrong: {
    fontWeight: typography.weight.bold,
  },
  plane: {
    marginTop: 1,
  },
});

/** HomeScreen's "Son maç" empty state — kept for that unrelated screen only. */
export function MatchRowPlaceholder({ mode }: { mode: 'upcoming' | 'result' }) {
  const colors = useColors();
  return (
    <View
      style={[legacyStyles.wrap, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSubtle }]}
      accessibilityLabel="Fikstür bekleniyor"
    >
      <View style={legacyStyles.card}>
        <Text variant="caption" muted>
          Fikstür
        </Text>
        <View style={legacyStyles.matchRow}>
          <View style={legacyStyles.teams}>
            <ClubCrest size="sm" />
            <Text numberOfLines={1} style={[legacyStyles.name, styles.clubName, { color: colors.text }]}>
              Eskişehirspor
            </Text>
            <Text variant="caption" muted style={legacyStyles.sep}>
              —
            </Text>
            <Text numberOfLines={1} muted style={[legacyStyles.name, legacyStyles.nameAway]}>
              Rakip
            </Text>
            <View style={[styles.emptyCrest, { borderColor: colors.border }]} />
          </View>
          <View style={legacyStyles.trailing}>
            <Text variant="caption" muted>
              {mode === 'result' ? '—' : 'Saat'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
