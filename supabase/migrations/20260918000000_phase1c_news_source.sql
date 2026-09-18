-- Phase 1C: distinguish admin-authored news from official-site imports.
-- Additive only: new nullable/defaulted columns, no existing column touched.

alter table public.news_articles
  add column source text not null default 'admin',
  add column source_url text;

alter table public.news_articles
  add constraint news_articles_source_check check (source in ('admin', 'official_site'));

alter table public.news_articles
  add constraint news_articles_official_needs_url check (
    source <> 'official_site' or source_url is not null
  );

-- Dedup key for re-running the official import without duplicating articles.
create unique index news_articles_source_url_unique_idx
  on public.news_articles (source_url)
  where source_url is not null;
