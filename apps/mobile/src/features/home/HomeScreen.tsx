import { View } from 'react-native';
import { router } from 'expo-router';
import {
  ClubIdentity,
  CompactNewsItem,
  EditorialEmpty,
  ErrorState,
  FeaturedStory,
  FutureSlot,
  OfflineState,
  Screen,
  ScreenSkeleton,
  SectionHeader,
  StoryRow,
} from '@/design';
import { toUserMessage } from '@/lib/errors';
import { useNetwork } from '@/lib/network-context';
import { useAnnouncement, useNewsList } from '@/features/news/hooks';
import { classifyFixtures, clubFixtures } from '@/features/matches/classification';
import { useFixture, useFixtures, useServerAlignedClock } from '@/features/matches/hooks';
import { MatchCard, MatchRowPlaceholder } from '@/features/matches/MatchCard';
import { MatchHero } from './MatchHero';
import { formatDate } from '@/lib/format';
import { deriveMatchClock } from '@eskisehirspor/shared';

export function HomeScreen() {
  const { isOffline, refresh } = useNetwork();
  const fixturesQuery = useFixtures();
  const newsQuery = useNewsList();
  const announcementQuery = useAnnouncement();
  const classified = classifyFixtures(clubFixtures(fixturesQuery.data ?? []));
  const preview = classified.upcoming[0] ?? null;
  useFixture(preview?.id ?? '');
  const nowMs = useServerAlignedClock(preview?.status === 'live' || preview?.status === 'halftime');

  const isLoading = fixturesQuery.isLoading || newsQuery.isLoading;
  const error = fixturesQuery.error ?? newsQuery.error;

  if (isLoading) {
    return (
      <Screen>
        <ScreenSkeleton />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorState
          description={toUserMessage(error, 'Ana sayfa yüklenemedi.')}
          onRetry={() => {
            void fixturesQuery.refetch();
            void newsQuery.refetch();
          }}
        />
      </Screen>
    );
  }

  const nextMatch = classified.upcoming[0] ?? null;
  const recent = classified.recent;
  const announcement = announcementQuery.data;
  const news = (newsQuery.data ?? []).filter((item) => item.id !== announcement?.id);
  const featured = announcement ?? news[0];
  const restNews = (announcement ? news : news.slice(1)).slice(0, 3);
  const recentResult = recent[0];
  const clock = deriveMatchClock({
    status: nextMatch?.status ?? 'scheduled',
    startedAt: nextMatch?.started_at ?? null,
    secondHalfStartedAt: nextMatch?.second_half_started_at ?? null,
    endedAt: nextMatch?.ended_at ?? null,
    nowMs,
  });

  return (
    <Screen
      scroll
      refreshing={(fixturesQuery.isRefetching || newsQuery.isRefetching) && !isLoading}
      onRefresh={() => {
        void fixturesQuery.refetch();
        void newsQuery.refetch();
        void announcementQuery.refetch();
      }}
    >
      {isOffline ? <OfflineState onRetry={() => void refresh()} /> : null}

      <ClubIdentity />

      <MatchHero fixture={nextMatch} clockLabel={clock.label} />

      <View>
        <SectionHeader
          eyebrow="Kulüp"
          title="Haber"
          actionLabel="Arşiv"
          onAction={() => router.push('/haber')}
        />
        {featured ? (
          <FeaturedStory
            title={featured.title}
            excerpt={featured.excerpt}
            category={featured.is_announcement ? 'Duyuru' : featured.categories[0]?.title}
            publishedAt={featured.published_at ? formatDate(featured.published_at) : null}
            imageUrl={featured.coverUrl}
            onPress={() => router.push(`/haber/${featured.slug}`)}
          />
        ) : (
          <FeaturedStory
            emptyTitle="Öne çıkan haber yok"
            emptyDescription="Kapak ve metin yayınlanınca bu alan ağırlığı taşır."
          />
        )}
        {restNews.map((item, index) =>
          index === 0 ? (
            <StoryRow
              key={item.id}
              title={item.title}
              category={item.categories[0]?.title}
              publishedAt={item.published_at ? formatDate(item.published_at) : null}
              imageUrl={item.coverUrl}
              onPress={() => router.push(`/haber/${item.slug}`)}
            />
          ) : (
            <CompactNewsItem
              key={item.id}
              title={item.title}
              publishedAt={item.published_at ? formatDate(item.published_at) : null}
              onPress={() => router.push(`/haber/${item.slug}`)}
            />
          ),
        )}
      </View>

      <View>
        <SectionHeader title="Son maç" quiet />
        {recentResult ? (
          <MatchCard fixture={recentResult} emphasizeScore />
        ) : (
          <>
            <MatchRowPlaceholder mode="result" />
            <EditorialEmpty
              title="Sonuç yok"
              description="Biten Eskişehirspor maçı burada durur."
            />
          </>
        )}
      </View>

      <View>
        <SectionHeader title="Kulüp hayatı" quiet />
        <FutureSlot title="Tribün" detail="Forum ve maç sohbeti sonraki fazda açılır." />
        <FutureSlot title="Oyna" detail="Puan, tahmin ve quiz sunucuda kurulunca görünür." />
      </View>
    </Screen>
  );
}
