import Link from 'next/link';
import { FIXTURE_STATUS_LABELS, type FixtureStatus } from '@eskisehirspor/shared';
import { importOfficialCatalog, startMatchAction } from '@/lib/matches/actions';
import { listAdminFixtures } from '@/lib/matches/queries';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export default async function MatchesListPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; imported?: string }>;
}) {
  const params = await searchParams;
  let rows: Awaited<ReturnType<typeof listAdminFixtures>> = [];
  let loadError: string | null = null;
  try {
    rows = await listAdminFixtures();
  } catch (error) {
    logger.error('Maç listesi', { code: 'admin.matches.page', cause: error instanceof Error ? error.message : 'unknown' });
    loadError = 'Maçlar yüklenemedi. Migrasyon uygulanmış olmalı.';
  }

  return (
    <main className="main wide">
      <div className="page-head">
        <h1>Maçlar</h1>
        <form action={importOfficialCatalog}>
          <button type="submit">Resmi katalogu içe aktar</button>
        </form>
      </div>
      <p className="muted">
        Kaynak: eskisehirspor.org.tr fikstür / A Takım ve TFF Nesine 3. Lig 2. Grup. Canlı skor sağlayıcısı yok.
      </p>
      {params.imported ? <p>Katalog işlendi. Mevcut maçlar tekrar yazılmadı.</p> : null}
      {params.error ? <p className="error">{params.error}</p> : null}
      {loadError ? <p className="error">{loadError}</p> : null}
      {rows.length === 0 && !loadError ? <p className="muted">Henüz maç kaydı yok.</p> : null}
      {rows.length > 0 ? (
        <table className="table">
          <thead>
            <tr>
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
                <td>{new Date(row.kickoff_at).toLocaleString('tr-TR')}</td>
                <td>{row.home_team.short_name}</td>
                <td>{row.away_team.short_name}</td>
                <td>{FIXTURE_STATUS_LABELS[row.status as FixtureStatus] ?? row.status}</td>
                <td>
                  {row.home_score ?? 0} — {row.away_score ?? 0}
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
