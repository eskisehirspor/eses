-- Phase 1A: official news + provider-neutral match data.
-- Default-deny RLS. Regular users cannot mutate official content.

create type public.news_status as enum ('draft', 'scheduled', 'published', 'archived');
create type public.fixture_status as enum (
  'scheduled',
  'live',
  'halftime',
  'finished',
  'postponed',
  'cancelled'
);

create or replace function public.is_content_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role in ('editor', 'admin', 'super_admin')
  );
$$;

create or replace function public.is_ops_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role in ('admin', 'super_admin')
  );
$$;

create or replace function public.news_is_publicly_visible(
  p_status public.news_status,
  p_published_at timestamptz
)
returns boolean
language sql
stable
as $$
  select p_status = 'published'
    and p_published_at is not null
    and p_published_at <= now();
$$;

revoke all on function public.is_content_manager() from public;
revoke all on function public.is_ops_admin() from public;
revoke all on function public.news_is_publicly_visible(public.news_status, timestamptz) from public;
grant execute on function public.is_content_manager() to authenticated;
grant execute on function public.is_ops_admin() to authenticated;
grant execute on function public.news_is_publicly_visible(public.news_status, timestamptz) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- News
-- ---------------------------------------------------------------------------

create table public.news_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint news_categories_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint news_categories_slug_len check (char_length(slug) between 2 and 64),
  constraint news_categories_title_len check (char_length(title) between 2 and 80)
);

create unique index news_categories_slug_uidx on public.news_categories (slug);

create table public.news_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null,
  excerpt text,
  content text not null default '',
  cover_path text,
  status public.news_status not null default 'draft',
  is_announcement boolean not null default false,
  published_at timestamptz,
  author_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint news_articles_title_len check (char_length(title) between 3 and 140),
  constraint news_articles_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint news_articles_slug_len check (char_length(slug) between 3 and 96),
  constraint news_articles_excerpt_len check (excerpt is null or char_length(excerpt) <= 400),
  constraint news_articles_published_needs_date check (
    status <> 'published' or published_at is not null
  )
);

create unique index news_articles_slug_uidx on public.news_articles (slug);
create index news_articles_public_idx
  on public.news_articles (published_at desc)
  where status = 'published';
create index news_articles_status_idx on public.news_articles (status, updated_at desc);
create index news_articles_announcement_idx
  on public.news_articles (published_at desc)
  where status = 'published' and is_announcement = true;

create table public.news_article_categories (
  article_id uuid not null references public.news_articles (id) on delete cascade,
  category_id uuid not null references public.news_categories (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (article_id, category_id)
);

create index news_article_categories_category_idx on public.news_article_categories (category_id);

create trigger news_categories_set_updated_at
  before update on public.news_categories
  for each row
  execute procedure public.set_updated_at();

create trigger news_articles_set_updated_at
  before update on public.news_articles
  for each row
  execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Matches (provider-neutral)
-- ---------------------------------------------------------------------------

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint venues_name_len check (char_length(name) between 2 and 80)
);

create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  season_label text not null,
  is_active boolean not null default true,
  provider_code text,
  provider_competition_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint competitions_name_len check (char_length(name) between 2 and 80),
  constraint competitions_season_len check (char_length(season_label) between 4 and 32)
);

create unique index competitions_provider_uidx
  on public.competitions (provider_code, provider_competition_id)
  where provider_code is not null and provider_competition_id is not null;

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text not null,
  slug text not null,
  is_eskisehirspor boolean not null default false,
  crest_path text,
  provider_code text,
  provider_team_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teams_name_len check (char_length(name) between 2 and 80),
  constraint teams_short_name_len check (char_length(short_name) between 2 and 24),
  constraint teams_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create unique index teams_slug_uidx on public.teams (slug);
create unique index teams_club_uidx on public.teams (is_eskisehirspor) where is_eskisehirspor;
create unique index teams_provider_uidx
  on public.teams (provider_code, provider_team_id)
  where provider_code is not null and provider_team_id is not null;

create table public.fixtures (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions (id) on delete restrict,
  venue_id uuid references public.venues (id) on delete set null,
  home_team_id uuid not null references public.teams (id) on delete restrict,
  away_team_id uuid not null references public.teams (id) on delete restrict,
  kickoff_at timestamptz not null,
  status public.fixture_status not null default 'scheduled',
  round_label text,
  home_score integer,
  away_score integer,
  provider_code text,
  provider_fixture_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fixtures_distinct_teams check (home_team_id <> away_team_id),
  constraint fixtures_scores_nonneg check (
    (home_score is null or home_score >= 0)
    and (away_score is null or away_score >= 0)
  ),
  constraint fixtures_finished_has_score check (
    status <> 'finished'
    or (home_score is not null and away_score is not null)
  )
);

create index fixtures_kickoff_idx on public.fixtures (kickoff_at);
create index fixtures_status_kickoff_idx on public.fixtures (status, kickoff_at);
create index fixtures_competition_idx on public.fixtures (competition_id, kickoff_at);
create unique index fixtures_provider_uidx
  on public.fixtures (provider_code, provider_fixture_id)
  where provider_code is not null and provider_fixture_id is not null;

create table public.match_events (
  id uuid primary key default gen_random_uuid(),
  fixture_id uuid not null references public.fixtures (id) on delete cascade,
  minute integer,
  extra_minute integer,
  event_type text not null,
  team_id uuid references public.teams (id) on delete set null,
  sort_key integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  provider_code text,
  provider_event_id text,
  created_at timestamptz not null default now(),
  constraint match_events_type_len check (char_length(event_type) between 2 and 32)
);

create index match_events_fixture_idx on public.match_events (fixture_id, sort_key);
create unique index match_events_provider_uidx
  on public.match_events (provider_code, provider_event_id)
  where provider_code is not null and provider_event_id is not null;

create table public.standings (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete cascade,
  position integer not null,
  played integer not null default 0,
  wins integer not null default 0,
  draws integer not null default 0,
  losses integer not null default 0,
  goals_for integer not null default 0,
  goals_against integer not null default 0,
  goal_difference integer generated always as (goals_for - goals_against) stored,
  points integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint standings_position_pos check (position >= 1),
  constraint standings_counts_nonneg check (
    played >= 0 and wins >= 0 and draws >= 0 and losses >= 0
    and goals_for >= 0 and goals_against >= 0 and points >= 0
  ),
  constraint standings_played_identity check (played = wins + draws + losses)
);

create unique index standings_competition_team_uidx on public.standings (competition_id, team_id);
create unique index standings_competition_position_uidx on public.standings (competition_id, position);
create index standings_competition_points_idx on public.standings (competition_id, points desc, goal_difference desc);

create trigger venues_set_updated_at
  before update on public.venues
  for each row execute procedure public.set_updated_at();
create trigger competitions_set_updated_at
  before update on public.competitions
  for each row execute procedure public.set_updated_at();
create trigger teams_set_updated_at
  before update on public.teams
  for each row execute procedure public.set_updated_at();
create trigger fixtures_set_updated_at
  before update on public.fixtures
  for each row execute procedure public.set_updated_at();
create trigger standings_set_updated_at
  before update on public.standings
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.news_categories enable row level security;
alter table public.news_articles enable row level security;
alter table public.news_article_categories enable row level security;
alter table public.venues enable row level security;
alter table public.competitions enable row level security;
alter table public.teams enable row level security;
alter table public.fixtures enable row level security;
alter table public.match_events enable row level security;
alter table public.standings enable row level security;

revoke all on table public.news_categories from public, anon, authenticated;
revoke all on table public.news_articles from public, anon, authenticated;
revoke all on table public.news_article_categories from public, anon, authenticated;
revoke all on table public.venues from public, anon, authenticated;
revoke all on table public.competitions from public, anon, authenticated;
revoke all on table public.teams from public, anon, authenticated;
revoke all on table public.fixtures from public, anon, authenticated;
revoke all on table public.match_events from public, anon, authenticated;
revoke all on table public.standings from public, anon, authenticated;

grant select on table public.news_categories to anon, authenticated;
grant select on table public.news_articles to anon, authenticated;
grant select on table public.news_article_categories to anon, authenticated;
grant select on table public.venues to anon, authenticated;
grant select on table public.competitions to anon, authenticated;
grant select on table public.teams to anon, authenticated;
grant select on table public.fixtures to anon, authenticated;
grant select on table public.match_events to anon, authenticated;
grant select on table public.standings to anon, authenticated;

grant insert, update, delete on table public.news_categories to authenticated;
grant insert, update, delete on table public.news_articles to authenticated;
grant insert, update, delete on table public.news_article_categories to authenticated;
grant insert, update, delete on table public.venues to authenticated;
grant insert, update, delete on table public.competitions to authenticated;
grant insert, update, delete on table public.teams to authenticated;
grant insert, update, delete on table public.fixtures to authenticated;
grant insert, update, delete on table public.match_events to authenticated;
grant insert, update, delete on table public.standings to authenticated;

-- Public can read published news; managers can read all rows.
-- Split so anonymous reads never require execute on is_content_manager().
create policy news_articles_select_public
  on public.news_articles
  for select
  to anon, authenticated
  using (public.news_is_publicly_visible(status, published_at));

create policy news_articles_select_manager
  on public.news_articles
  for select
  to authenticated
  using (public.is_content_manager());

create policy news_articles_insert
  on public.news_articles
  for insert
  to authenticated
  with check (public.is_content_manager());

create policy news_articles_update
  on public.news_articles
  for update
  to authenticated
  using (public.is_content_manager())
  with check (public.is_content_manager());

create policy news_articles_delete
  on public.news_articles
  for delete
  to authenticated
  using (
    public.is_content_manager()
    and status in ('draft', 'archived')
  );

create policy news_categories_select_public
  on public.news_categories
  for select
  to anon, authenticated
  using (is_active = true);

create policy news_categories_select_manager
  on public.news_categories
  for select
  to authenticated
  using (public.is_content_manager());

create policy news_categories_mutate
  on public.news_categories
  for all
  to authenticated
  using (public.is_content_manager())
  with check (public.is_content_manager());

create policy news_article_categories_select_public
  on public.news_article_categories
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.news_articles a
      where a.id = article_id
        and public.news_is_publicly_visible(a.status, a.published_at)
    )
  );

create policy news_article_categories_select_manager
  on public.news_article_categories
  for select
  to authenticated
  using (public.is_content_manager());

create policy news_article_categories_mutate
  on public.news_article_categories
  for all
  to authenticated
  using (public.is_content_manager())
  with check (public.is_content_manager());

create policy venues_select on public.venues for select to anon, authenticated using (true);
create policy competitions_select on public.competitions for select to anon, authenticated using (true);
create policy teams_select on public.teams for select to anon, authenticated using (true);
create policy fixtures_select on public.fixtures for select to anon, authenticated using (true);
create policy match_events_select on public.match_events for select to anon, authenticated using (true);
create policy standings_select on public.standings for select to anon, authenticated using (true);

create policy venues_mutate on public.venues for all to authenticated
  using (public.is_ops_admin()) with check (public.is_ops_admin());
create policy competitions_mutate on public.competitions for all to authenticated
  using (public.is_ops_admin()) with check (public.is_ops_admin());
create policy teams_mutate on public.teams for all to authenticated
  using (public.is_ops_admin()) with check (public.is_ops_admin());
create policy fixtures_mutate on public.fixtures for all to authenticated
  using (public.is_ops_admin()) with check (public.is_ops_admin());
create policy match_events_mutate on public.match_events for all to authenticated
  using (public.is_ops_admin()) with check (public.is_ops_admin());
create policy standings_mutate on public.standings for all to authenticated
  using (public.is_ops_admin()) with check (public.is_ops_admin());

-- Author names on public articles only (not a full profile directory).
grant select (id, display_name, avatar_path) on table public.profiles to anon;
create policy profiles_select_anon
  on public.profiles
  for select
  to anon
  using (
    deleted_at is null
    and exists (
      select 1
      from public.news_articles a
      where a.author_id = profiles.id
        and public.news_is_publicly_visible(a.status, a.published_at)
    )
  );

-- ---------------------------------------------------------------------------
-- Storage: news covers (public read, manager write)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'news-covers',
  'news-covers',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy news_covers_public_read
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'news-covers');

create policy news_covers_manager_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'news-covers'
    and public.is_content_manager()
    and (storage.foldername(name))[1] = 'articles'
  );

create policy news_covers_manager_update
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'news-covers'
    and public.is_content_manager()
    and (storage.foldername(name))[1] = 'articles'
  )
  with check (
    bucket_id = 'news-covers'
    and public.is_content_manager()
    and (storage.foldername(name))[1] = 'articles'
  );

create policy news_covers_manager_delete
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'news-covers' and public.is_content_manager());

-- Taxonomy only. No fabricated articles, fixtures, or scores.
insert into public.news_categories (slug, title, sort_order)
values
  ('kulup', 'Kulüp', 1),
  ('a-takim', 'A Takım', 2),
  ('duyuru', 'Duyuru', 3);
