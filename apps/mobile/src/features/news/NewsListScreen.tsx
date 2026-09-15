import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import {
  Chip,
  CompactNewsItem,
  ErrorState,
  FeaturedStory,
  OfflineState,
  PageHeader,
  Screen,
  ScreenSkeleton,
  StoryRow,
} from '@/design';
import { spacing } from '@/design/tokens';
import { formatDate } from '@/lib/format';
import { toUserMessage } from '@/lib/errors';
import { useNetwork } from '@/lib/network-context';
import { useNewsCategories, useNewsList } from './hooks';

export function NewsListScreen() {
  const { isOffline, refresh } = useNetwork();
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const categories = useNewsCategories();
  const news = useNewsList(categoryId);

  if (news.isLoading) {
    return (
      <Screen>
        <ScreenSkeleton />
      </Screen>
    );
  }

  if (news.isError) {
    return (
      <Screen>
        <ErrorState
          description={toUserMessage(news.error, 'Haberler yüklenemedi.')}
          onRetry={() => void news.refetch()}
        />
      </Screen>
    );
  }

  const items = news.data ?? [];
  const featured = items[0];
  const secondary = items[1];
  const rest = items.slice(2);

  return (
    <Screen
      scroll
      refreshing={news.isRefetching && !news.isLoading}
      onRefresh={() => {
        void news.refetch();
        void categories.refetch();
      }}
    >
      {isOffline ? <OfflineState onRetry={() => void refresh()} /> : null}
      <PageHeader title="Haberler" subtitle="Resmi yayın · editöryal arşiv" />
      <View style={styles.chips}>
        <Chip label="Tümü" selected={!categoryId} onPress={() => setCategoryId(undefined)} />
        {(categories.data ?? []).map((category) => (
          <Chip
            key={category.id}
            label={category.title}
            selected={categoryId === category.id}
            onPress={() => setCategoryId(category.id)}
          />
        ))}
      </View>
      {featured ? (
        <FeaturedStory
          title={featured.title}
          excerpt={featured.excerpt}
          category={featured.categories[0]?.title}
          publishedAt={featured.published_at ? formatDate(featured.published_at) : null}
          imageUrl={featured.coverUrl}
          onPress={() => router.push(`/haber/${featured.slug}`)}
        />
      ) : (
        <FeaturedStory
          emptyTitle="Yayında haber yok"
          emptyDescription="Kapak fotoğrafı ve metin yayınlanınca bu geometri dolar. Sahte haber yok."
        />
      )}
      {secondary ? (
        <StoryRow
          title={secondary.title}
          category={secondary.categories[0]?.title}
          publishedAt={secondary.published_at ? formatDate(secondary.published_at) : null}
          imageUrl={secondary.coverUrl}
          onPress={() => router.push(`/haber/${secondary.slug}`)}
        />
      ) : null}
      {rest.map((item) => (
        <CompactNewsItem
          key={item.id}
          title={item.title}
          publishedAt={item.published_at ? formatDate(item.published_at) : null}
          onPress={() => router.push(`/haber/${item.slug}`)}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
});
