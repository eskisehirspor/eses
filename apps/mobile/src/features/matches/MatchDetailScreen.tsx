import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  MATCH_EVENT_LABELS,
  deriveMatchClock,
  formatKickoffDate,
  type MatchEventType,
} from '@eskisehirspor/shared';
import {
  EditorialEmpty,
  ErrorState,
  OfflineState,
  Screen,
  ScreenSkeleton,
  SectionHeader,
  Text,
} from '@/design';
import { iconSize, radii, spacing } from '@/design/tokens';
import { useColors } from '@/design/theme-context';
import { toUserMessage } from '@/lib/errors';
import { useNetwork } from '@/lib/network-context';
import { useFixture, useMatchEvents, useServerAlignedClock } from './hooks';
import { MatchScoreboard } from './MatchScoreboard';
import { fixtureAwayTrip } from './away-trip';
import { TicketButton } from './TicketButton';
import { WeatherValue } from './WeatherPanel';

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.infoRow}>
      <Text variant="caption" muted style={styles.infoLabel}>
        {label}
      </Text>
      <View style={styles.infoValue}>{children}</View>
    </View>
  );
}

/** "19.09.2026 · Cumartesi" — date and weekday together, once, in Maç bilgisi only. */
function formatKickoffDateWithWeekday(iso: string): string {
  const date = formatKickoffDate(iso);
  if (!date) {
    return '—';
  }
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }
  const weekday = new Intl.DateTimeFormat('tr-TR', { weekday: 'long', timeZone: 'Europe/Istanbul' }).format(parsed);
  return `${date} · ${weekday}`;
}

export function MatchDetailScreen({ id }: { id: string }) {
  const colors = useColors();
  const { isOffline, refresh } = useNetwork();
  const query = useFixture(id);
  const eventsQuery = useMatchEvents(id);
  const live = query.data?.status === 'live' || query.data?.status === 'halftime';
  const nowMs = useServerAlignedClock(Boolean(live));

  if (query.isLoading) {
    return (
      <Screen>
        <ScreenSkeleton />
      </Screen>
    );
  }

  if (query.isError) {
    return (
      <Screen>
        <ErrorState
          description={toUserMessage(query.error, 'Maç yüklenemedi.')}
          onRetry={() => void query.refetch()}
        />
      </Screen>
    );
  }

  if (!query.data) {
    return (
      <Screen>
        <ErrorState description="Maç bulunamadı." />
      </Screen>
    );
  }

  const fixture = query.data;
  const clock = deriveMatchClock({
    status: fixture.status,
    startedAt: fixture.started_at,
    secondHalfStartedAt: fixture.second_half_started_at,
    endedAt: fixture.ended_at,
    nowMs,
  });
  const events = eventsQuery.data ?? [];
  const awayTrip = fixtureAwayTrip(fixture);
  const clubAway = fixture.away_team.is_eskisehirspor;
  const kickoffDate = formatKickoffDateWithWeekday(fixture.kickoff_at);
  const venueName = fixture.venue?.name ?? awayTrip?.stadiumName ?? null;
  const venueCity = fixture.venue?.city ?? awayTrip?.city ?? null;

  return (
    <Screen
      scroll
      refreshing={(query.isRefetching || eventsQuery.isRefetching) && !query.isLoading}
      onRefresh={() => {
        void query.refetch();
        void eventsQuery.refetch();
      }}
    >
      {isOffline ? <OfflineState onRetry={() => void refresh()} /> : null}
      <MatchScoreboard fixture={fixture} kicker="Maç merkezi" clockLabel={clock.label} hideKickoffSummary />
      <View>
        <SectionHeader title="Maç bilgisi" />
        <View style={[styles.infoCard, { backgroundColor: colors.surfaceRaised }]}>
          <InfoRow label="Tarih">
            <Text numberOfLines={1}>{kickoffDate}</Text>
          </InfoRow>
          <InfoRow label="Tahmini Hava Durumu">
            <WeatherValue />
          </InfoRow>
          <InfoRow label="Stadyum">
            {venueName ? (
              <Text numberOfLines={1}>
                {venueName}
                {venueCity ? ` · ${venueCity}` : ''}
              </Text>
            ) : (
              <Text muted>Stadyum kaydı yok.</Text>
            )}
          </InfoRow>
          {clubAway && awayTrip?.approxRoadKm != null ? (
            <View style={styles.travelRow}>
              <Ionicons name="airplane-outline" size={iconSize.sm} color={colors.red} accessibilityLabel="Deplasman maçı" />
              <Text variant="caption" muted>
                Deplasman · ~{awayTrip.approxRoadKm} km
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      <TicketButton />
      <View>
        <SectionHeader title="Olaylar" quiet />
        {events.length === 0 ? (
          <EditorialEmpty
            title="Akış yok"
            description="Gol ve kartlar operasyon kaydı gelince burada durur."
          />
        ) : (
          events.map((event) => (
            <Text key={event.id}>
              {event.minute != null ? `${event.minute}${event.extra_minute ? `+${event.extra_minute}` : ''}'` : '—'}{' '}
              {MATCH_EVENT_LABELS[event.event_type as MatchEventType] ?? event.event_type}
            </Text>
          ))
        )}
      </View>
      <View>
        <SectionHeader title="İstatistik" quiet />
        <EditorialEmpty title="Ölçüm yok" description="Sahte yüzde yok. Veri bağlanınca bu geometri dolar." />
      </View>
      <View>
        <SectionHeader title="Kadrolar" quiet />
        <EditorialEmpty title="İlk 11 yok" description="Kadro yayınlanınca ev ve deplasman burada ayrılır." />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xxs,
  },
  travelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  infoLabel: {
    minWidth: 88,
  },
  infoValue: {
    flex: 1,
    alignItems: 'flex-end',
  },
});
