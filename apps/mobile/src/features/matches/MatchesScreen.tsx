import { useState } from 'react';
import { View } from 'react-native';
import {
  EditorialEmpty,
  ErrorState,
  OfflineState,
  PageHeader,
  Screen,
  ScreenSkeleton,
  SectionHeader,
  SegmentedControl,
} from '@/design';
import { toUserMessage } from '@/lib/errors';
import { useNetwork } from '@/lib/network-context';
import { classifyFixtures, partitionClubFixtures } from './classification';
import { useFixtures, useStandings } from './hooks';
import { MatchCard, MatchRowPlaceholder } from './MatchCard';
import { StandingsTable } from './StandingsTable';

const TABS = [
  { value: 'upcoming', label: 'Yaklaşan' },
  { value: 'results', label: 'Sonuçlar' },
  { value: 'table', label: 'Puan Durumu' },
] as const;

type Tab = (typeof TABS)[number]['value'];

export function MatchesScreen() {
  const { isOffline, refresh } = useNetwork();
  const fixturesQuery = useFixtures();
  const standingsQuery = useStandings();
  const [tab, setTab] = useState<Tab>('upcoming');

  if (fixturesQuery.isLoading || standingsQuery.isLoading) {
    return (
      <Screen>
        <ScreenSkeleton />
      </Screen>
    );
  }

  if (fixturesQuery.isError) {
    return (
      <Screen>
        <ErrorState
          description={toUserMessage(fixturesQuery.error, 'Maçlar yüklenemedi.')}
          onRetry={() => void fixturesQuery.refetch()}
        />
      </Screen>
    );
  }

  const { upcoming, recent } = classifyFixtures(fixturesQuery.data ?? []);
  const clubUpcoming = partitionClubFixtures(upcoming);
  const clubRecent = partitionClubFixtures(recent);
  const nextClub = clubUpcoming.club[0] ?? null;
  const laterClub = clubUpcoming.club.slice(1);
  const standings = standingsQuery.data;

  return (
    <Screen
      scroll
      refreshing={(fixturesQuery.isRefetching || standingsQuery.isRefetching) && !fixturesQuery.isLoading}
      onRefresh={() => {
        void fixturesQuery.refetch();
        void standingsQuery.refetch();
      }}
    >
      {isOffline ? <OfflineState onRetry={() => void refresh()} /> : null}
      <View>
        <PageHeader title="Maçlar" subtitle="Yaklaşan · Sonuçlar · Puan durumu" />
        <SegmentedControl value={tab} options={TABS} onChange={setTab} />
      </View>
      {tab === 'upcoming' ? (
        upcoming.length === 0 ? (
          <View>
            <MatchRowPlaceholder mode="upcoming" />
            <EditorialEmpty
              title="Yaklaşan maç yok"
              description="Fikstür kaydı gelince Eskişehirspor maçları burada durur."
            />
          </View>
        ) : (
          <View>
            {nextClub ? <MatchCard fixture={nextClub} featured /> : null}
            {laterClub.map((fixture) => (
              <MatchCard key={fixture.id} fixture={fixture} />
            ))}
            {clubUpcoming.rest.length > 0 ? (
              <>
                <SectionHeader title="Grup fikstürü" quiet />
                {clubUpcoming.rest.map((fixture) => (
                  <MatchCard key={fixture.id} fixture={fixture} compact />
                ))}
              </>
            ) : null}
          </View>
        )
      ) : null}
      {tab === 'results' ? (
        recent.length === 0 ? (
          <View>
            <MatchRowPlaceholder mode="result" />
            <EditorialEmpty
              title="Sonuç yok"
              description="Biten Eskişehirspor maçları burada görünür."
            />
          </View>
        ) : (
          <View>
            {clubRecent.club.map((fixture) => (
              <MatchCard key={fixture.id} fixture={fixture} emphasizeScore />
            ))}
            {clubRecent.rest.length > 0 ? (
              <>
                <SectionHeader title="Grup sonuçları" quiet />
                {clubRecent.rest.map((fixture) => (
                  <MatchCard key={fixture.id} fixture={fixture} emphasizeScore compact />
                ))}
              </>
            ) : null}
          </View>
        )
      ) : null}
      {tab === 'table' ? (
        standingsQuery.isError ? (
          <ErrorState
            description={toUserMessage(standingsQuery.error, 'Puan durumu yüklenemedi.')}
            onRetry={() => void standingsQuery.refetch()}
          />
        ) : !standings?.competition || standings.rows.length === 0 ? (
          <View>
            <StandingsTable rows={[]} competitionLabel="Aktif lig kaydı yok" />
            <EditorialEmpty
              title="Puan durumu yok"
              description="Lig tablosu resmi kayıt gelince dolar."
            />
          </View>
        ) : (
          <StandingsTable
            rows={standings.rows}
            competitionLabel={`${standings.competition.name} · ${standings.competition.season_label}`}
          />
        )
      ) : null}
    </Screen>
  );
}
