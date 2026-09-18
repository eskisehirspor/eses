'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { hasContentAccess, slugify } from '@eskisehirspor/shared';
import { getSessionRoles } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

const OFFICIAL_NEWS_URL = 'https://www.eskisehirspor.org.tr/haberler';

async function requireManager() {
  const session = await getSessionRoles();
  if (!session.userId || !hasContentAccess(session.roles)) {
    redirect('/unauthorized');
  }
  return session;
}

export type OfficialNewsCard = {
  url: string;
  imageUrl: string | null;
  title: string;
  excerpt: string;
  dateText: string;
};

const NAMED_ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&quot;': '"',
  '&rsquo;': '’',
  '&lsquo;': '‘',
  '&uuml;': 'ü',
  '&Uuml;': 'Ü',
  '&ouml;': 'ö',
  '&Ouml;': 'Ö',
  '&ccedil;': 'ç',
  '&Ccedil;': 'Ç',
};

function decodeEntities(input: string): string {
  return input
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCharCode(Number(code)))
    .replace(/&[a-zA-Z]+;/g, (match) => NAMED_ENTITIES[match] ?? match);
}

/**
 * Parses the eskisehirspor.org.tr/haberler listing markup. Matches the fixed
 * `haberindexBox` card template observed on the live site (one `<a>` wrapping
 * an image, a `.haberbaslik` title, a `.habericerik` excerpt, and a
 * `.habertarih` date span). If the club redesigns that page, this parser will
 * simply find 0 cards — importOfficialNews() treats that as an explicit error
 * rather than silently doing nothing.
 */
export function parseOfficialNewsHtml(html: string): OfficialNewsCard[] {
  const cards: OfficialNewsCard[] = [];
  const blockRegex =
    /<a class='noTextDecoration' href="([^"]+)">[\s\S]*?<img[^>]*src="([^"]+)"[\s\S]*?<div class="haberbaslik">\s*([^<]+?)\s*<\/div>[\s\S]*?<div class="habericerik">\s*([\s\S]*?)<\/div>[\s\S]*?<div class="habertarih">\s*<span>([\d.]+)<\/span>/g;
  let match: RegExpExecArray | null;
  while ((match = blockRegex.exec(html)) !== null) {
    const [, url, imageUrl, rawTitle, rawExcerpt, dateText] = match;
    if (!url || !rawTitle || !dateText) {
      continue;
    }
    cards.push({
      url,
      imageUrl: imageUrl ?? null,
      title: decodeEntities(rawTitle).trim(),
      excerpt: decodeEntities(rawExcerpt ?? '').replace(/\s+/g, ' ').trim(),
      dateText,
    });
  }
  return cards;
}

/** "16.09.2026" (club site format, no time published on the listing page) → ISO, 09:00 Europe/Istanbul. */
export function parseOfficialNewsDate(dateText: string): string | null {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(dateText);
  if (!match) {
    return null;
  }
  const [, day, month, year] = match;
  const date = new Date(`${year}-${month}-${day}T09:00:00+03:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * Admin-triggered, server-side import from the official club news page.
 * Never runs on a mobile render and never scrapes from the client. Re-running
 * is safe: existing rows are matched by `source_url` and skipped.
 */
export async function importOfficialNews() {
  await requireManager();

  let html: string;
  try {
    const response = await fetch(OFFICIAL_NEWS_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EskisehirsporApp/1.0)' },
    });
    if (!response.ok) {
      throw new Error(`http_${response.status}`);
    }
    html = await response.text();
  } catch (error) {
    logger.error('Resmi haber sayfası alınamadı', {
      code: 'news.official_fetch',
      cause: error instanceof Error ? error.message : 'unknown',
    });
    redirect(`/console/news?error=${encodeURIComponent('Resmi haber sayfasına ulaşılamadı.')}`);
    return;
  }

  const cards = parseOfficialNewsHtml(html);
  if (cards.length === 0) {
    logger.error('Resmi haber sayfasında kart bulunamadı', { code: 'news.official_parse' });
    redirect(`/console/news?error=${encodeURIComponent('Resmi sayfada haber kartı bulunamadı.')}`);
    return;
  }

  const supabase = await createSupabaseServerClient();
  let imported = 0;
  let skipped = 0;

  for (const card of cards) {
    const publishedAt = parseOfficialNewsDate(card.dateText);
    if (!publishedAt) {
      skipped += 1;
      continue;
    }
    const { data: existing } = await supabase
      .from('news_articles')
      .select('id')
      .eq('source_url', card.url)
      .maybeSingle();
    if (existing) {
      skipped += 1;
      continue;
    }
    const { error } = await supabase.from('news_articles').insert({
      title: card.title,
      slug: `${slugify(card.title)}-${Date.now().toString(36)}`,
      excerpt: card.excerpt.slice(0, 400) || null,
      content: card.excerpt,
      cover_path: card.imageUrl,
      status: 'published',
      is_announcement: false,
      published_at: publishedAt,
      source: 'official_site',
      source_url: card.url,
    });
    if (error) {
      logger.error('Resmi haber yazılamadı', { code: 'news.official_insert', cause: error.message });
      skipped += 1;
      continue;
    }
    imported += 1;
  }

  revalidatePath('/console/news');
  redirect(`/console/news?imported=${imported}&skipped=${skipped}`);
}
