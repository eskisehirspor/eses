import Link from 'next/link';
import {
  CATALOG_CREST_SOURCE_LABELS,
  CATALOG_TEAMS,
  FIXTURE_STATUS_LABELS,
  catalogCrestPngObjectName,
  catalogCrestSourceKind,
  displayTeamName,
  formatKickoffLabel,
  type FixtureStatus,
} from '@eskisehirspor/shared';
import { importOfficialCatalog, startMatchAction } from '@/lib/matches/actions';
import { listAdminFixtures, listAdminTeams } from '@/lib/matches/queries';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const catalogBySlug = new Map(CATALOG_TEAMS.map((team) => [team.slug, team]));

function crestRows(team: {
  name: string;
  slug: string;
  is_eskisehirspor: boolean;
  crest_path: string | null;
  provider_team_id?: string | null;
}) {
  const catalog = catalogBySlug.get(team.slug);
  const kind = catalog ? catalogCrestSourceKind(catalog) : team.is_eskisehirspor ? 'club' : 'none';
  const expectedPath =
    kind === 'club'
      ? null
      : catalog
        ? catalogCrestPngObjectName(catalog.providerTeamId)
        : team.provider_team_id
          ? catalogCrestPngObjectName(team.provider_team_id)
          : null;
  const status =
    kind === 'club'
      ? 'Yerel'
      : team.crest_path
        ? team.crest_path === expectedPath
          ? 'Hazır'
          : 'Yüklü'
        : 'Eksik';
  return {
    sourceLabel: CATALOG_CREST_SOURCE_LABELS[kind],
    path: team.crest_path ?? expectedPath ?? '—',
    status,
  };
}

export default async function MatchesListPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; imported?: string }>;
}) {
  const params = await searchParams;
  let rows: Awaited<ReturnType<typeof listAdminFixtures>> = [];
  let teams: Awaited<ReturnType<typeof listAdminTeams>> = [];
  let loadError: string | null = null;
  try {
    [rows, teams] = await Promise.all([listAdminFixtures(), listAdminTeams()]);
  } catch (error) {
    logger.error('Maç listesi', { code: 'admin.matches.page', cause: error instanceof Error ? error.message : 'unknown' });
    loadError = 'Maçlar yüklenemedi. Migrasyon uygulanmış olmalı.';
  }

  const finished = rows.filter((row) => row.status === 'finished').length;
  const openScores = rows.filter(
    (row) => row.status === 'scheduled' && row.home_score == null && row.away_score == null,
  ).length;
  const teamCount = new Set(rows.flatMap((row) => [row.home_team.slug, row.away_team.slug])).size;
  const storedCrests = teams.filter((team) => !team.is_eskisehirspor && Boolean(team.crest_path)).length;

  return (
    <main className="main wide">
      <div className="page-head">
        <h1>Maçlar</h1>
        <form action={importOfficialCatalog}>
          <button type="submit">Resmi katalogu içe aktar</button>
        </form>
      </div>
      <p className="muted">
        Kaynak: TFF Nesine 3. Lig 2. Grup (pageID=971) ve eskisehirspor.org.tr fikstür doğrulaması. Canlı skor
        sağlayıcısı yok.
      </p>
      <p className="muted">
        Veritabanı: {teamCount} takım · {rows.length} maç · {finished} sonuç · {openScores} skorsuz yaklaşan ·{' '}
        {storedCrests}/{Math.max(teams.length - 1, 0)} rakip arması
      </p>
      {params.imported ? <p>Katalog işlendi. Canlı maçlar korundu; diğer kayıtlar TFF kataloğuyla hizalandı.</p> : null}
      {params.error ? <p className="error">{params.error}</p> : null}
      {loadError ? <p className="error">{loadError}</p> : null}
      {teams.length > 0 ? (
        <section>
          <h2>Takım armaları</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Takım</th>
                <th>Kaynak tipi</th>
                <th>crest_path</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => {
                const crest = crestRows(team);
                return (
                  <tr key={team.id}>
                    <td>{team.name}</td>
                    <td className="muted">{crest.sourceLabel}</td>
                    <td className="muted">{crest.path}</td>
                    <td>{crest.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ) : null}
      {rows.length === 0 && !loadError ? <p className="muted">Henüz maç kaydı yok.</p> : null}
      {rows.length > 0 ? (
        <table className="table">
          <thead>
            <tr>
              <th>Hafta</th>
              <th>Tarih</th>
              <th>Ev</th>
              <th>Deplasman</th>
              <th>Durum</th>
              <th>Skor</th>
              <th>Kaynak</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.round_label ?? '—'}</td>
                <td>{formatKickoffLabel(row.kickoff_at)}</td>
                <td>{displayTeamName(row.home_team)}</td>
                <td>{displayTeamName(row.away_team)}</td>
                <td>{FIXTURE_STATUS_LABELS[row.status as FixtureStatus] ?? row.status}</td>
                <td>
                  {row.home_score == null || row.away_score == null
                    ? '—'
                    : `${row.home_score} — ${row.away_score}`}
                </td>
                <td className="muted">{row.live_source}</td>
                <td>
                  <div className="row-actions">
                    <Link href={`/console/matches/${row.id}`}>Yönet</Link>
                    {row.status === 'scheduled' ? (
                      <form action={startMatchAction}>
                        <input type="hidden" name="fixture_id" value={row.id} />
                        <button type="submit">Başlat</button>
                      </form>
                    ) : null}
                    {row.status === 'finished' ? <Link href={`/console/matches/${row.id}`}>Görüntüle</Link> : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </main>
  );
}
