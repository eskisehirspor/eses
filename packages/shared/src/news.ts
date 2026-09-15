import { z } from 'zod';

export const NEWS_STATUSES = ['draft', 'scheduled', 'published', 'archived'] as const;
export const NewsStatusSchema = z.enum(NEWS_STATUSES);
export type NewsStatus = z.infer<typeof NewsStatusSchema>;

export const NEWS_COVERS_BUCKET = 'news-covers';

export function slugify(input: string): string {
  return input
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replaceAll('ı', 'i')
    .replaceAll('ğ', 'g')
    .replaceAll('ü', 'u')
    .replaceAll('ş', 's')
    .replaceAll('ö', 'o')
    .replaceAll('ç', 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
}

export const SlugSchema = z
  .string()
  .trim()
  .min(3)
  .max(96)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug yalnızca küçük harf, rakam ve tire içerebilir.');

export const NewsArticleWriteSchema = z.object({
  title: z.string().trim().min(3).max(140),
  slug: SlugSchema,
  excerpt: z.string().trim().max(400).optional().nullable(),
  content: z.string().max(50_000),
  cover_path: z.string().min(1).max(512).optional().nullable(),
  status: NewsStatusSchema,
  is_announcement: z.boolean().default(false),
  published_at: z.string().min(1).optional().nullable(),
  category_ids: z.array(z.string().uuid()).default([]),
});

export type NewsArticleWrite = z.infer<typeof NewsArticleWriteSchema>;

export function isNewsPubliclyVisible(input: {
  status: NewsStatus;
  published_at: string | null;
  now?: Date;
}): boolean {
  if (input.status !== 'published' || !input.published_at) {
    return false;
  }
  const now = input.now ?? new Date();
  return new Date(input.published_at).getTime() <= now.getTime();
}

export function canDeleteNews(status: NewsStatus): boolean {
  return status === 'draft' || status === 'archived';
}

export function newsCoverObjectPath(articleId: string, fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? 'jpg';
  const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
  return `articles/${articleId}/${crypto.randomUUID()}.${safeExt}`;
}

export function slugTaken(
  existing: readonly { id: string; slug: string }[],
  slug: string,
  exceptId?: string,
): boolean {
  return existing.some((row) => row.slug === slug && row.id !== exceptId);
}

export function filterPublicNews<T extends { status: NewsStatus; published_at: string | null }>(
  articles: readonly T[],
  now?: Date,
): T[] {
  return articles.filter((article) =>
    isNewsPubliclyVisible({
      status: article.status,
      published_at: article.published_at,
      ...(now ? { now } : {}),
    }),
  );
}
