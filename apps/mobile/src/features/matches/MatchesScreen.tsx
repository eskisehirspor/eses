import { useState } from 'react';
import { View } from 'react-native';
import {
  EditorialEmpty,
  ErrorState,
  OfflineState,
  PageHeader,
  Screen,
  ScreenSkeleton,
  SegmentedControl,
} from '@/design';
import { toUserMessage } from '@/lib/errors';
import { useNetwork } from '@/lib/network-context';
import { clubUpcomingFixtures, groupFixturesByWeek, resolveCurrentWeekIndex } from './classification';
import { useFixtures, useStandings } from './hooks';
import { FixtureRow, UpcomingMatchCard, UpcomingRowPlaceholder } from './MatchCard';
import { StandingsTable } from './StandingsTable';
import { WeekSelector } from './WeekSelector';

const TABS = [
  { value: 'upcoming', label: 'Yaklaşan' },
  { value: 'fixtures', label: 'Fikstür' },
  { value: 'table', label: 'Puan Durumu' },
] as const;

type Tab = (typeof TABS)[number]['value'];

export function MatchesScreen() {
  const { isOffline, refresh } = useNetwork();
  const fixturesQuery = useFixtures();
  const standingsQuery = useStandings();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [weekIndex, setWeekIndex] = useState<number | null>(null);
  // Captured once at mount — "current week" only needs to be right when the screen opens.
  const [nowMs] = useState(() => Date.now());

  const weekGroups = groupFixturesByWeek(fixturesQuery.data ?? []);

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

  const clubUpcoming = clubUpcomingFixtures(fixturesQuery.data ?? []);
  const standings = standingsQuery.data;
  const activeWeekIndex = weekIndex ?? resolveCurrentWeekIndex(weekGroups, nowMs);
  const activeWeek = weekGroups[activeWeekIndex] ?? null;

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
        <PageHeader title="Maçlar" />
        <SegmentedControl value={tab} options={TABS} onChange={setTab} />
      </View>
      {tab === 'upcoming' ? (
        clubUpcoming.length === 0 ? (
          <View>
            <UpcomingRowPlaceholder />
            <EditorialEmpty
              title="Yaklaşan maç yok"
              description="Fikstür kaydı gelince Eskişehirspor maçları burada durur."
            />
          </View>
        ) : (
          <View>
            {clubUpcoming.map((fixture, index) => (
              <UpcomingMatchCard key={fixture.id} fixture={fixture} featured={index === 0} />
            ))}
          </View>
        )
      ) : null}
      {tab === 'fixtures' ? (
        weekGroups.length === 0 ? (
          <EditorialEmpty title="Fikstür yok" description="Resmi fikstür kaydı gelince burada dolar." />
        ) : (
          <View>
            <WeekSelector
              label={activeWeek?.label ? activeWeek.label.toLocaleUpperCase('tr-TR') : 'TARİH BELİRSİZ'}
              onPrevious={() => setWeekIndex(Math.max(0, activeWeekIndex - 1))}
              onNext={() => setWeekIndex(Math.min(weekGroups.length - 1, activeWeekIndex + 1))}
              hasPrevious={activeWeekIndex > 0}
              hasNext={activeWeekIndex < weekGroups.length - 1}
            />
            {(activeWeek?.fixtures ?? []).map((fixture) => (
              <FixtureRow key={fixture.id} fixture={fixture} />
            ))}
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
