'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  canDeleteNews,
  hasContentAccess,
  NewsArticleWriteSchema,
  NewsStatusSchema,
  slugify,
  type NewsStatus,
} from '@eskisehirspor/shared';
import { getSessionRoles } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { toAdminErrorMessage } from '@/lib/errors';
import { logger } from '@/lib/logger';

async function requireManager() {
  const session = await getSessionRoles();
  if (!session.userId || !hasContentAccess(session.roles)) {
    redirect('/unauthorized');
  }
  return session;
}

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function toIsoOrNull(raw: string): string | null {
  if (!raw) {
    return null;
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

export async function saveNewsArticle(formData: FormData) {
  const session = await requireManager();
  const id = formString(formData, 'id') || null;
  const status = NewsStatusSchema.parse(formString(formData, 'status') || 'draft');
  const publishedAtRaw = formString(formData, 'published_at');
  const publishedAtIso = toIsoOrNull(publishedAtRaw);
  const parsed = NewsArticleWriteSchema.safeParse({
    title: formString(formData, 'title'),
    slug: formString(formData, 'slug') || slugify(formString(formData, 'title')),
    excerpt: formString(formData, 'excerpt') || null,
    content: String(formData.get('content') ?? ''),
    cover_path: formString(formData, 'cover_path') || null,
    status,
    is_announcement: formData.get('is_announcement') === 'on',
    published_at:
      status === 'published' ? publishedAtIso ?? new Date().toISOString() : publishedAtIso,
    category_ids: formData.getAll('category_ids').map(String).filter(Boolean),
  });

  if (!parsed.success) {
    redirect(`/console/news/${id ?? 'new'}?error=validation`);
  }

  const supabase = await createSupabaseServerClient();
  const payload = {
    title: parsed.data.title,
    slug: parsed.data.slug,
    excerpt: parsed.data.excerpt,
    content: parsed.data.content,
    cover_path: parsed.data.cover_path,
    status: parsed.data.status,
    is_announcement: parsed.data.is_announcement,
    published_at: parsed.data.published_at,
    author_id: session.userId,
  };

  let articleId = id;
  if (id) {
    const { error } = await supabase.from('news_articles').update(payload).eq('id', id);
    if (error) {
      logger.error('Haber güncellenemedi', { code: error.code ?? 'news.update', cause: error.message });
      redirect(`/console/news/${id}?error=${encodeURIComponent(toAdminErrorMessage(error))}`);
    }
  } else {
    const { data, error } = await supabase.from('news_articles').insert(payload).select('id').single();
    if (error || !data) {
      logger.error('Haber oluşturulamadı', { code: error?.code ?? 'news.insert', cause: error?.message ?? 'missing' });
      redirect(`/console/news/new?error=${encodeURIComponent(toAdminErrorMessage(error))}`);
    }
    articleId = data.id;
  }

  if (articleId) {
    const { error: deleteLinksError } = await supabase
      .from('news_article_categories')
      .delete()
      .eq('article_id', articleId);
    if (deleteLinksError) {
      logger.error('Kategori bağları silinemedi', {
        code: 'news.categories',
        cause: deleteLinksError.message,
      });
    }
    if (parsed.data.category_ids.length > 0) {
      const { error: linkError } = await supabase.from('news_article_categories').insert(
        parsed.data.category_ids.map((category_id) => ({
          article_id: articleId,
          category_id,
        })),
      );
      if (linkError) {
        logger.error('Kategori bağlanamadı', { code: 'news.categories', cause: linkError.message });
      }
    }
  }

  revalidatePath('/console/news');
  redirect(`/console/news/${articleId}`);
}

export async function setNewsStatus(articleId: string, status: NewsStatus) {
  await requireManager();
  const supabase = await createSupabaseServerClient();
  const patch: { status: NewsStatus; published_at?: string } = { status };
  if (status === 'published') {
    patch.published_at = new Date().toISOString();
  }
  const { error } = await supabase.from('news_articles').update(patch).eq('id', articleId);
  if (error) {
    logger.error('Durum güncellenemedi', { code: error.code ?? 'news.status', cause: error.message });
    redirect(`/console/news/${articleId}?error=${encodeURIComponent(toAdminErrorMessage(error))}`);
  }
  revalidatePath('/console/news');
  revalidatePath(`/console/news/${articleId}`);
}

export async function deleteNewsArticle(articleId: string, status: NewsStatus) {
  await requireManager();
  if (!canDeleteNews(status)) {
    redirect(`/console/news/${articleId}?error=${encodeURIComponent('Yayındaki haber silinemez. Önce arşivle.')}`);
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('news_articles').delete().eq('id', articleId);
  if (error) {
    logger.error('Haber silinemedi', { code: error.code ?? 'news.delete', cause: error.message });
    redirect(`/console/news/${articleId}?error=${encodeURIComponent(toAdminErrorMessage(error))}`);
  }
  revalidatePath('/console/news');
  redirect('/console/news');
}
