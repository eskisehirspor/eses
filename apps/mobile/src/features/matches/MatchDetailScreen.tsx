import { View } from 'react-native';
import { MATCH_EVENT_LABELS, deriveMatchClock, displaysScore, type MatchEventType } from '@eskisehirspor/shared';
import {
  EditorialEmpty,
  ErrorState,
  OfflineState,
  Screen,
  ScreenSkeleton,
  SectionHeader,
  Text,
} from '@/design';
import { formatMatchDay, formatTime } from '@/lib/format';
import { toUserMessage } from '@/lib/errors';
import { useNetwork } from '@/lib/network-context';
import { useFixture, useMatchEvents, useServerAlignedClock } from './hooks';
import { MatchScoreboard } from './MatchScoreboard';

export function MatchDetailScreen({ id }: { id: string }) {
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
  const showScore = displaysScore(fixture.status);
  const clock = deriveMatchClock({
    status: fixture.status,
    startedAt: fixture.started_at,
    secondHalfStartedAt: fixture.second_half_started_at,
    endedAt: fixture.ended_at,
    nowMs,
  });
  const events = eventsQuery.data ?? [];

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
      <MatchScoreboard
        fixture={fixture}
        kicker={showScore ? 'Maç merkezi' : 'Maç günü'}
        clockLabel={clock.label}
      />
      <View>
        <SectionHeader title="Maç bilgisi" quiet />
        <Text muted>
          {formatMatchDay(fixture.kickoff_at)} · {formatTime(fixture.kickoff_at)}
        </Text>
        {fixture.venue ? (
          <Text muted>
            {fixture.venue.name}
            {fixture.venue.city ? ` · ${fixture.venue.city}` : ''}
          </Text>
        ) : (
          <Text variant="caption" muted>
            Stadyum kaydı yok.
          </Text>
        )}
      </View>
      <View>
        <SectionHeader title="Olaylar" quiet />
        {events.length === 0 ? (
          <EditorialEmpty
            title="Akış yok"
            description="Gol ve kartlar operasyon kaydı gelince burada durur."
          />
        ) : (
          events.map((event) => (
            <Text key={event.id} muted>
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
