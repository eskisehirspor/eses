import { useLocalSearchParams } from 'expo-router';
import { NewsDetailScreen } from '@/features/news/NewsDetailScreen';
import { ErrorState, Screen } from '@/design';

export default function NewsDetailRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  if (!slug) {
    return (
      <Screen>
        <ErrorState description="Haber bulunamadı." />
      </Screen>
    );
  }
  return <NewsDetailScreen slug={slug} />;
}
