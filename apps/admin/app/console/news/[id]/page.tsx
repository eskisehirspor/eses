import { notFound } from 'next/navigation';
import { saveNewsArticle } from '@/lib/news/actions';
import { getNewsArticle, listNewsCategories } from '@/lib/news/queries';
import { NewsForm } from '../news-form';
import { NewsActions } from '../news-actions';
import type { NewsStatus } from '@eskisehirspor/shared';

export default async function EditNewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const [article, categories] = await Promise.all([getNewsArticle(id), listNewsCategories()]);
  if (!article) {
    notFound();
  }

  const categoryIds =
    article.news_article_categories?.map((row: { category_id: string }) => row.category_id) ?? [];

  return (
    <main className="main wide">
      <h1>Haberi düzenle</h1>
      {query.error ? <p className="error">{query.error}</p> : null}
      <NewsActions id={article.id} status={article.status as NewsStatus} />
      <NewsForm
        action={saveNewsArticle}
        categories={categories}
        article={{
          id: article.id,
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          content: article.content,
          cover_path: article.cover_path,
          status: article.status,
          is_announcement: article.is_announcement,
          published_at: article.published_at,
          category_ids: categoryIds,
        }}
      />
    </main>
  );
}
