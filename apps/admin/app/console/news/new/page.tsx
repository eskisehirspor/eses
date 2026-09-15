import { saveNewsArticle } from '@/lib/news/actions';
import { listNewsCategories } from '@/lib/news/queries';
import { NewsForm } from '../news-form';

export default async function NewNewsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const categories = await listNewsCategories();

  return (
    <main className="main wide">
      <h1>Yeni haber</h1>
      {params.error ? <p className="error">{params.error}</p> : null}
      <NewsForm
        action={saveNewsArticle}
        categories={categories}
        article={{
          title: '',
          slug: '',
          excerpt: null,
          content: '',
          cover_path: null,
          status: 'draft',
          is_announcement: false,
          published_at: null,
          category_ids: [],
        }}
      />
    </main>
  );
}
