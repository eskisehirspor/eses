import { hasContentAccess, type NewsStatus } from '@eskisehirspor/shared';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSessionRoles } from '@/lib/auth/session';
import { logger } from '@/lib/logger';

async function requireContentManager() {
  const session = await getSessionRoles();
  if (!hasContentAccess(session.roles)) {
    redirect('/unauthorized');
  }
}

export type NewsListRow = {
  id: string;
  title: string;
  slug: string;
  status: NewsStatus;
  is_announcement: boolean;
  published_at: string | null;
  updated_at: string;
  source: 'admin' | 'official_site';
};

export async function listNewsArticles(input: { q?: string; status?: NewsStatus | 'all' }) {
  await requireContentManager();
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from('news_articles')
    .select('id, title, slug, status, is_announcement, published_at, updated_at, source')
    .order('updated_at', { ascending: false });

  if (input.status && input.status !== 'all') {
    query = query.eq('status', input.status);
  }
  if (input.q?.trim()) {
    query = query.ilike('title', `%${input.q.trim()}%`);
  }

  const { data, error } = await query;
  if (error) {
    logger.error('Haber listesi alınamadı', { code: 'news.list', cause: error.message });
    throw error;
  }
  return (data ?? []) as NewsListRow[];
}

export async function getNewsArticle(id: string) {
  await requireContentManager();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('news_articles')
    .select(
      'id, title, slug, excerpt, content, cover_path, status, is_announcement, published_at, author_id, news_article_categories(category_id)',
    )
    .eq('id', id)
    .maybeSingle();
  if (error) {
    logger.error('Haber okunamadı', { code: 'news.read', cause: error.message });
    throw error;
  }
  return data;
}

export async function listNewsCategories() {
  await requireContentManager();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('news_categories')
    .select('id, slug, title, sort_order, is_active')
    .order('sort_order', { ascending: true });
  if (error) {
    logger.error('Kategoriler okunamadı', { code: 'news.categories', cause: error.message });
    throw error;
  }
  return data ?? [];
}
