import { NEWS_COVERS_BUCKET } from '@eskisehirspor/shared';
import { getSupabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export type NewsCategory = {
  id: string;
  slug: string;
  title: string;
};

export type NewsListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_path: string | null;
  coverUrl: string | null;
  published_at: string | null;
  is_announcement: boolean;
  categories: NewsCategory[];
};

export type NewsDetail = NewsListItem & {
  content: string;
  authorName: string | null;
};

function requireClient() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('not_configured');
  }
  return client;
}

function coverUrl(path: string | null): string | null {
  if (!path) {
    return null;
  }
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }
  return client.storage.from(NEWS_COVERS_BUCKET).getPublicUrl(path).data.publicUrl;
}

function asCategory(value: NewsCategory | NewsCategory[] | null | undefined): NewsCategory | null {
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapCategories(row: {
  news_article_categories?: { news_categories: NewsCategory | NewsCategory[] | null }[] | null;
}): NewsCategory[] {
  return (row.news_article_categories ?? [])
    .map((item) => asCategory(item.news_categories))
    .filter((item): item is NewsCategory => Boolean(item));
}

export async function fetchNewsCategories(): Promise<NewsCategory[]> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('news_categories')
    .select('id, slug, title')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) {
    logger.error('Kategoriler alınamadı', { code: 'news.categories', cause: error.message });
    throw error;
  }
  return data ?? [];
}

export async function fetchPublishedNews(input?: { categoryId?: string }): Promise<NewsListItem[]> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('news_articles')
    .select(
      'id, title, slug, excerpt, cover_path, published_at, is_announcement, status, news_article_categories(news_categories(id, slug, title))',
    )
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .limit(30);

  if (error) {
    logger.error('Haberler alınamadı', { code: 'news.list', cause: error.message });
    throw error;
  }

  const mapped = (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    cover_path: row.cover_path,
    coverUrl: coverUrl(row.cover_path),
    published_at: row.published_at,
    is_announcement: row.is_announcement,
    categories: mapCategories(row),
  }));

  if (!input?.categoryId) {
    return mapped;
  }
  return mapped.filter((item) => item.categories.some((category) => category.id === input.categoryId));
}

export async function fetchNewsBySlug(slug: string): Promise<NewsDetail | null> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('news_articles')
    .select(
      'id, title, slug, excerpt, content, cover_path, published_at, is_announcement, status, author:profiles!author_id(display_name), news_article_categories(news_categories(id, slug, title))',
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .maybeSingle();
  if (error) {
    logger.error('Haber detayı alınamadı', { code: 'news.detail', cause: error.message });
    throw error;
  }
  if (!data) {
    return null;
  }
  const author = data.author as { display_name: string } | { display_name: string }[] | null;
  const authorName = Array.isArray(author) ? (author[0]?.display_name ?? null) : (author?.display_name ?? null);
  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt,
    content: data.content,
    cover_path: data.cover_path,
    coverUrl: coverUrl(data.cover_path),
    published_at: data.published_at,
    is_announcement: data.is_announcement,
    categories: mapCategories(data),
    authorName,
  };
}

export async function fetchAnnouncement(): Promise<NewsListItem | null> {
  const items = await fetchPublishedNews();
  return items.find((item) => item.is_announcement) ?? null;
}
