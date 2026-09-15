import { useLocalSearchParams } from 'expo-router';
import { MatchDetailScreen } from '@/features/matches/MatchDetailScreen';
import { ErrorState, Screen } from '@/design';

export default function MatchDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  if (!id) {
    return (
      <Screen>
        <ErrorState description="Maç kimliği eksik." />
      </Screen>
    );
  }
  return <MatchDetailScreen id={id} />;
}
