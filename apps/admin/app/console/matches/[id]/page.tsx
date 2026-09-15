import Link from 'next/link';
import { notFound } from 'next/navigation';
import { canCorrectLiveMatch, type FixtureStatus } from '@eskisehirspor/shared';
import { getSessionRoles } from '@/lib/auth/session';
import { fetchServerNow, getAdminFixture, listAdminMatchEvents, listFixturePlayers } from '@/lib/matches/queries';
import { LiveControls } from './live-controls';

export const dynamic = 'force-dynamic';

export default async function MatchControlPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const session = await getSessionRoles();
  const fixture = await getAdminFixture(id);
  if (!fixture) {
    notFound();
  }
  const [players, events, serverNow] = await Promise.all([
    listFixturePlayers(fixture.home_team_id, fixture.away_team_id),
    listAdminMatchEvents(fixture.id),
    fetchServerNow(),
  ]);

  return (
    <main className="main wide">
      <p>
        <Link href="/console/matches">← Maçlar</Link>
      </p>
      {query.error ? <p className="error">{query.error}</p> : null}
      <LiveControls
        fixtureId={fixture.id}
        status={fixture.status as FixtureStatus}
        home={fixture.home_team}
        away={fixture.away_team}
        homeScore={fixture.home_score ?? 0}
        awayScore={fixture.away_score ?? 0}
        startedAt={fixture.started_at}
        secondHalfStartedAt={fixture.second_half_started_at}
        endedAt={fixture.ended_at}
        serverNow={serverNow}
        players={players}
        events={events}
        canCorrect={canCorrectLiveMatch(session.roles)}
      />
    </main>
  );
}
