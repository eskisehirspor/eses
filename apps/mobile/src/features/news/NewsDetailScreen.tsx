import { Linking, StyleSheet, View } from 'react-native';
import {
  EditorialEmpty,
  EditorialImage,
  ErrorState,
  OfflineState,
  PressableScale,
  Screen,
  ScreenSkeleton,
  SectionHeader,
  Text,
} from '@/design';
import { layout, spacing } from '@/design/tokens';
import { formatDate } from '@/lib/format';
import { toUserMessage } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { useNetwork } from '@/lib/network-context';
import { useNewsDetail } from './hooks';

export function NewsDetailScreen({ slug }: { slug: string }) {
  const { isOffline, refresh } = useNetwork();
  const query = useNewsDetail(slug);

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
          description={toUserMessage(query.error, 'Haber yüklenemedi.')}
          onRetry={() => void query.refetch()}
        />
      </Screen>
    );
  }

  if (!query.data) {
    return (
      <Screen>
        <ErrorState description="Bu haber yayında değil veya bulunamadı." />
      </Screen>
    );
  }

  const article = query.data;

  return (
    <Screen
      scroll
      refreshing={query.isRefetching && !query.isLoading}
      onRefresh={() => {
        void query.refetch();
      }}
    >
      {isOffline ? <OfflineState onRetry={() => void refresh()} /> : null}
      <View style={styles.bleed}>
        <EditorialImage
          uri={article.coverUrl}
          height={layout.mediaHero}
          overlay={Boolean(article.coverUrl)}
          label="Haber"
          accessibilityLabel={article.title}
        />
      </View>
      <View style={styles.meta}>
        <Text variant="caption" tone="accent">
          {article.categories[0]?.title ?? (article.is_announcement ? 'Duyuru' : 'Kulüp')}
        </Text>
        <Text variant="title">{article.title}</Text>
        <Text variant="caption" muted>
          {[article.published_at ? formatDate(article.published_at) : null, article.authorName]
            .filter(Boolean)
            .join('  ·  ')}
        </Text>
      </View>
      <Text>{article.content}</Text>
      {article.source === 'official_site' && article.sourceUrl ? (
        <PressableScale
          onPress={() => {
            void Linking.openURL(article.sourceUrl!).catch((error: unknown) => {
              logger.error('Resmi haber bağlantısı açılamadı', {
                code: 'news.source_link',
                cause: error instanceof Error ? error.message : 'unknown',
              });
            });
          }}
          accessibilityRole="link"
          accessibilityLabel="Resmi sitede oku"
        >
          <Text tone="accent">Resmi sitede oku →</Text>
        </PressableScale>
      ) : null}
      <View>
        <SectionHeader title="İlgili" quiet />
        <EditorialEmpty
          title="Bağlantılı haber yok"
          description="İlgili içerik sonraki fazda bu satır geometrisinde listelenir."
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  bleed: {
    marginHorizontal: -layout.gutter,
  },
  meta: {
    gap: spacing.sm,
  },
});
