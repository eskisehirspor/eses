import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getPublicEnv } from '@/lib/env';
import { getSupabaseClient } from '@/lib/supabase';
import { fetchActiveStandings, fetchFixture, fetchFixtures, fetchMatchEvents, fetchServerNow } from './api';

export function useFixtures() {
  return useQuery({
    queryKey: ['fixtures'],
    queryFn: fetchFixtures,
    enabled: getPublicEnv().isConfigured,
  });
}

export function useFixture(id: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['fixtures', id],
    queryFn: () => fetchFixture(id),
    enabled: Boolean(id) && getPublicEnv().isConfigured,
  });

  useEffect(() => {
    if (!id || !getPublicEnv().isConfigured) {
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      return;
    }
    const channel = supabase
      .channel(`fixture:${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fixtures', filter: `id=eq.${id}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['fixtures', id] });
          void queryClient.invalidateQueries({ queryKey: ['fixtures'] });
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'match_events', filter: `fixture_id=eq.${id}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['match-events', id] });
          void queryClient.invalidateQueries({ queryKey: ['fixtures', id] });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [id, queryClient]);

  return query;
}

export function useMatchEvents(fixtureId: string) {
  return useQuery({
    queryKey: ['match-events', fixtureId],
    queryFn: () => fetchMatchEvents(fixtureId),
    enabled: Boolean(fixtureId) && getPublicEnv().isConfigured,
  });
}

export function useServerAlignedClock(active: boolean) {
  const serverQuery = useQuery({
    queryKey: ['server-now'],
    queryFn: fetchServerNow,
    enabled: active && getPublicEnv().isConfigured,
    refetchInterval: active ? 30_000 : false,
  });
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!active) {
      return;
    }
    const started = Date.now();
    const timer = setInterval(() => {
      setElapsedMs(Date.now() - started);
    }, 1000);
    return () => clearInterval(timer);
  }, [active, serverQuery.data]);

  if (!serverQuery.data) {
    return elapsedMs;
  }
  return Date.parse(serverQuery.data) + elapsedMs;
}

export function useStandings() {
  return useQuery({
    queryKey: ['standings', 'active'],
    queryFn: fetchActiveStandings,
    enabled: getPublicEnv().isConfigured,
  });
}
