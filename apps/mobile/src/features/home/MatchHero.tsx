import { router } from 'expo-router';
import { MatchScoreboard } from '@/features/matches/MatchScoreboard';
import type { FixtureRecord } from '@/features/matches/api';

export function MatchHero({ fixture, clockLabel }: { fixture: FixtureRecord | null; clockLabel?: string | null }) {
  return (
    <MatchScoreboard
      fixture={fixture}
      kicker="Sıradaki maç"
      cta={fixture ? 'Maç merkezi' : undefined}
      onPress={fixture ? () => router.push(`/maclar/${fixture.id}`) : undefined}
      clockLabel={clockLabel}
    />
  );
}
