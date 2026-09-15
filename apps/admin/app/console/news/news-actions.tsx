'use client';

import { deleteNewsArticle, setNewsStatus } from '@/lib/news/actions';
import type { NewsStatus } from '@eskisehirspor/shared';
import { canDeleteNews } from '@eskisehirspor/shared';

export function NewsActions({ id, status }: { id: string; status: NewsStatus }) {
  return (
    <div className="row-actions">
      {status !== 'published' ? (
        <form action={() => setNewsStatus(id, 'published')}>
          <button type="submit">Yayınla</button>
        </form>
      ) : (
        <form action={() => setNewsStatus(id, 'archived')}>
          <button className="secondary" type="submit">
            Arşivle
          </button>
        </form>
      )}
      {status === 'published' ? (
        <form action={() => setNewsStatus(id, 'draft')}>
          <button className="secondary" type="submit">
            Yayından al
          </button>
        </form>
      ) : null}
      {canDeleteNews(status) ? (
        <form
          action={() => {
            if (window.confirm('Bu taslak/arşiv haberi silinsin mi?')) {
              return deleteNewsArticle(id, status);
            }
          }}
        >
          <button className="secondary" type="submit">
            Sil
          </button>
        </form>
      ) : null}
    </div>
  );
}
