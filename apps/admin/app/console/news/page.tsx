import Link from 'next/link';
import { NEWS_STATUSES, type NewsStatus } from '@eskisehirspor/shared';
import { listNewsArticles } from '@/lib/news/queries';
import { importOfficialNews } from '@/lib/news/import-official';
import { logger } from '@/lib/logger';
import { NewsActions } from './news-actions';

export default async function NewsListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; error?: string; imported?: string; skipped?: string }>;
}) {
  const params = await searchParams;
  const status =
    params.status && NEWS_STATUSES.includes(params.status as NewsStatus)
      ? (params.status as NewsStatus)
      : 'all';

  let articles: Awaited<ReturnType<typeof listNewsArticles>> = [];
  let loadError: string | null = null;
  try {
    articles = await listNewsArticles({ q: params.q, status });
  } catch (error) {
    logger.error('Haber listesi sayfası', {
      code: 'news.list_page',
      cause: error instanceof Error ? error.message : 'unknown',
    });
    loadError = 'Haberler yüklenemedi.';
  }

  return (
    <main className="main wide">
      <div className="page-head">
        <h1>Haberler</h1>
        <div className="row-actions">
          <form action={importOfficialNews}>
            <button type="submit" className="secondary">
              Resmi Siteden İçe Aktar
            </button>
          </form>
          <Link href="/console/news/new" className="button-link">
            Yeni haber
          </Link>
        </div>
      </div>
      <form className="filters" method="get">
        <input name="q" placeholder="Başlık ara" defaultValue={params.q ?? ''} />
        <select name="status" defaultValue={status}>
          <option value="all">Tüm durumlar</option>
          <option value="draft">Taslak</option>
          <option value="scheduled">Zamanlanmış</option>
          <option value="published">Yayında</option>
          <option value="archived">Arşiv</option>
        </select>
        <button type="submit">Filtrele</button>
      </form>
      {params.imported != null ? (
        <p className="muted">
          Resmi siteden {params.imported} yeni haber içe aktarıldı{Number(params.skipped) > 0 ? `, ${params.skipped} atlandı (zaten vardı veya tarih ayrıştırılamadı)` : ''}.
        </p>
      ) : null}
      {params.error ? <p className="error">{params.error}</p> : null}
      {loadError ? <p className="error">{loadError}</p> : null}
      {!loadError && articles.length === 0 ? (
        <p className="muted">Henüz haber yok. Sahte içerik eklenmedi.</p>
      ) : null}
      {articles.length > 0 ? (
        <table className="table">
          <thead>
            <tr>
              <th>Başlık</th>
              <th>Durum</th>
              <th>Slug</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => (
              <tr key={article.id}>
                <td>
                  <Link href={`/console/news/${article.id}`}>{article.title}</Link>
                  {article.is_announcement ? <span className="pill">Duyuru</span> : null}
                  {article.source === 'official_site' ? <span className="pill">Resmi</span> : null}
                </td>
                <td>{article.status}</td>
                <td className="muted">{article.slug}</td>
                <td>
                  <NewsActions id={article.id} status={article.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </main>
  );
}
