-- Phase 1B-A: manual live match center, squad, audit, provider-neutral live fields.
-- Clock is NOT ticked in the database. started_at / second_half_started_at are authoritative.

create type public.live_source as enum ('manual', 'provider', 'hybrid');

create type public.match_event_type as enum (
  'goal',
  'yellow_card',
  'red_card',
  'substitution',
  'period_start',
  'halftime',
  'second_half',
  'full_time'
);

create or replace function public.is_super_admin()
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
      and role = 'super_admin'
  );
$$;

revoke all on function public.is_super_admin() from public;
grant execute on function public.is_super_admin() to authenticated;

create or replace function public.server_now()
returns timestamptz
language sql
stable
as $$
  select now();
$$;

revoke all on function public.server_now() from public;
grant execute on function public.server_now() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Players
-- ---------------------------------------------------------------------------

create table public.players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  display_name text not null,
  first_name text,
  last_name text,
  shirt_number integer,
  position text,
  is_active boolean not null default true,
  photo_path text,
  provider_code text,
  provider_player_id text,
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint players_display_name_len check (char_length(display_name) between 2 and 80),
  constraint players_shirt_nonneg check (shirt_number is null or shirt_number between 1 and 99),
  constraint players_position_len check (position is null or char_length(position) between 2 and 24)
);

create index players_team_idx on public.players (team_id, is_active);
create unique index players_provider_uidx
  on public.players (provider_code, provider_player_id)
  where provider_code is not null and provider_player_id is not null;
create unique index players_team_shirt_uidx
  on public.players (team_id, shirt_number)
  where shirt_number is not null and is_active;

create trigger players_set_updated_at
  before update on public.players
  for each row
  execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Fixtures: live operation columns
-- ---------------------------------------------------------------------------

alter table public.fixtures
  add column if not exists started_at timestamptz,
  add column if not exists second_half_started_at timestamptz,
  add column if not exists ended_at timestamptz,
  add column if not exists current_minute integer,
  add column if not exists current_minute_extra integer,
  add column if not exists live_updated_at timestamptz,
  add column if not exists live_source public.live_source not null default 'manual';

update public.fixtures
set home_score = 0
where home_score is null and status = 'scheduled';

update public.fixtures
set away_score = 0
where away_score is null and status = 'scheduled';

alter table public.fixtures
  alter column home_score set default 0,
  alter column away_score set default 0;

alter table public.fixtures
  drop constraint if exists fixtures_scores_nonneg;

alter table public.fixtures
  add constraint fixtures_scores_nonneg check (
    (home_score is null or home_score >= 0)
    and (away_score is null or away_score >= 0)
  );

alter table public.fixtures
  add constraint fixtures_live_minutes_nonneg check (
    (current_minute is null or current_minute >= 0)
    and (current_minute_extra is null or current_minute_extra >= 0)
  );

alter table public.fixtures
  add constraint fixtures_second_half_after_start check (
    second_half_started_at is null
    or (started_at is not null and second_half_started_at >= started_at)
  );

alter table public.fixtures
  add constraint fixtures_ended_after_start check (
    ended_at is null
    or (started_at is not null and ended_at >= started_at)
  );

-- ---------------------------------------------------------------------------
-- Match events: audit + squad links (no hard delete)
-- ---------------------------------------------------------------------------

alter table public.match_events
  add column if not exists player_id uuid references public.players (id) on delete set null,
  add column if not exists related_player_id uuid references public.players (id) on delete set null,
  add column if not exists created_by uuid references public.profiles (id) on delete set null,
  add column if not exists reversed_at timestamptz,
  add column if not exists reversed_by uuid references public.profiles (id) on delete set null,
  add column if not exists reversal_of_event_id uuid references public.match_events (id) on delete set null,
  add column if not exists notify_kind text,
  add column if not exists client_request_id uuid;

alter table public.match_events
  add constraint match_events_notify_kind_len check (
    notify_kind is null or char_length(notify_kind) between 2 and 32
  );

create index match_events_fixture_created_idx on public.match_events (fixture_id, created_at);
create unique index match_events_request_uidx
  on public.match_events (fixture_id, client_request_id)
  where client_request_id is not null;

-- ---------------------------------------------------------------------------
-- Operation audit
-- ---------------------------------------------------------------------------

create table public.match_operation_log (
  id uuid primary key default gen_random_uuid(),
  fixture_id uuid not null references public.fixtures (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  event_id uuid references public.match_events (id) on delete set null,
  client_request_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint match_operation_log_action_len check (char_length(action) between 2 and 48)
);

create index match_operation_log_fixture_idx on public.match_operation_log (fixture_id, created_at desc);
create unique index match_operation_log_request_uidx
  on public.match_operation_log (fixture_id, client_request_id)
  where client_request_id is not null;

-- ---------------------------------------------------------------------------
-- Live column guard: table updates from admin CMS cannot change live fields
-- ---------------------------------------------------------------------------

create or replace function public.fixtures_guard_live_columns()
returns trigger
language plpgsql
as $$
begin
  if current_setting('es.live_rpc', true) = '1' then
    return new;
  end if;
  if tg_op = 'UPDATE' then
    if new.home_score is distinct from old.home_score
      or new.away_score is distinct from old.away_score
      or new.status is distinct from old.status
      or new.started_at is distinct from old.started_at
      or new.second_half_started_at is distinct from old.second_half_started_at
      or new.ended_at is distinct from old.ended_at
      or new.current_minute is distinct from old.current_minute
      or new.current_minute_extra is distinct from old.current_minute_extra
      or new.live_updated_at is distinct from old.live_updated_at
      or new.live_source is distinct from old.live_source
    then
      raise exception 'live_fields_protected' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists fixtures_guard_live_columns on public.fixtures;
create trigger fixtures_guard_live_columns
  before update on public.fixtures
  for each row
  execute procedure public.fixtures_guard_live_columns();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.players enable row level security;
alter table public.match_operation_log enable row level security;

revoke all on table public.players from public, anon, authenticated;
revoke all on table public.match_operation_log from public, anon, authenticated;
revoke insert, update, delete on table public.match_events from authenticated;

grant select on table public.players to anon, authenticated;
grant select on table public.match_operation_log to authenticated;
grant insert, update, delete on table public.players to authenticated;

create policy players_select on public.players for select to anon, authenticated using (true);
create policy players_mutate on public.players for all to authenticated
  using (public.is_ops_admin()) with check (public.is_ops_admin());

create policy match_operation_log_select_ops on public.match_operation_log
  for select to authenticated
  using (public.is_ops_admin());

-- match_events remain publicly readable; mutations only via SECURITY DEFINER RPCs.
drop policy if exists match_events_mutate on public.match_events;

-- ---------------------------------------------------------------------------
-- Storage: team crests (optional operator upload; not required for live ops)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'team-crests',
  'team-crests',
  true,
  1048576,
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do nothing;

drop policy if exists team_crests_public_read on storage.objects;
create policy team_crests_public_read
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'team-crests');

drop policy if exists team_crests_ops_insert on storage.objects;
create policy team_crests_ops_insert
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'team-crests' and public.is_ops_admin());

drop policy if exists team_crests_ops_update on storage.objects;
create policy team_crests_ops_update
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'team-crests' and public.is_ops_admin())
  with check (bucket_id = 'team-crests' and public.is_ops_admin());

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

do $$
begin
  begin
    alter publication supabase_realtime add table public.fixtures;
  exception
    when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.match_events;
  exception
    when duplicate_object then null;
  end;
end;
$$;

alter table public.fixtures replica identity full;
alter table public.match_events replica identity full;

-- ---------------------------------------------------------------------------
-- Live RPC helpers
-- ---------------------------------------------------------------------------

create or replace function public.live_require_ops()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  actor uuid;
begin
  actor := auth.uid();
  if actor is null or not public.is_ops_admin() then
    raise exception 'live_forbidden' using errcode = '42501';
  end if;
  return actor;
end;
$$;

create or replace function public.live_require_super_admin()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  actor uuid;
begin
  actor := auth.uid();
  if actor is null or not public.is_super_admin() then
    raise exception 'live_forbidden' using errcode = '42501';
  end if;
  return actor;
end;
$$;

create or replace function public.live_lock_fixture(p_fixture_id uuid)
returns public.fixtures
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.fixtures;
begin
  select * into row from public.fixtures where id = p_fixture_id for update;
  if not found then
    raise exception 'fixture_not_found' using errcode = 'P0002';
  end if;
  return row;
end;
$$;

create or replace function public.live_existing_request(p_fixture_id uuid, p_client_request_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  logged public.match_operation_log;
begin
  if p_client_request_id is null then
    return null;
  end if;
  select * into logged
  from public.match_operation_log
  where fixture_id = p_fixture_id
    and client_request_id = p_client_request_id;
  if not found then
    return null;
  end if;
  return jsonb_build_object(
    'ok', true,
    'idempotent', true,
    'action', logged.action,
    'event_id', logged.event_id,
    'fixture_id', logged.fixture_id
  );
end;
$$;

create or replace function public.live_write_log(
  p_fixture_id uuid,
  p_actor uuid,
  p_action text,
  p_event_id uuid,
  p_client_request_id uuid,
  p_metadata jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.match_operation_log (
    fixture_id, actor_id, action, event_id, client_request_id, metadata
  ) values (
    p_fixture_id, p_actor, p_action, p_event_id, p_client_request_id, coalesce(p_metadata, '{}'::jsonb)
  );
end;
$$;

create or replace function public.live_insert_event(
  p_fixture public.fixtures,
  p_actor uuid,
  p_type public.match_event_type,
  p_minute integer,
  p_extra integer,
  p_team_id uuid,
  p_player_id uuid,
  p_related_player_id uuid,
  p_notify_kind text,
  p_client_request_id uuid,
  p_payload jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  event_id uuid;
  next_sort integer;
begin
  select coalesce(max(sort_key), 0) + 1 into next_sort
  from public.match_events
  where fixture_id = p_fixture.id;

  insert into public.match_events (
    fixture_id,
    minute,
    extra_minute,
    event_type,
    team_id,
    player_id,
    related_player_id,
    sort_key,
    payload,
    created_by,
    notify_kind,
    client_request_id
  ) values (
    p_fixture.id,
    p_minute,
    p_extra,
    p_type::text,
    p_team_id,
    p_player_id,
    p_related_player_id,
    next_sort,
    coalesce(p_payload, '{}'::jsonb),
    p_actor,
    p_notify_kind,
    p_client_request_id
  )
  returning id into event_id;

  return event_id;
end;
$$;

create or replace function public.live_touch_fixture(
  p_fixture_id uuid,
  p_status public.fixture_status,
  p_home integer,
  p_away integer,
  p_started_at timestamptz,
  p_second_half timestamptz,
  p_ended_at timestamptz,
  p_minute integer,
  p_extra integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('es.live_rpc', '1', true);
  update public.fixtures
  set
    status = p_status,
    home_score = p_home,
    away_score = p_away,
    started_at = p_started_at,
    second_half_started_at = p_second_half,
    ended_at = p_ended_at,
    current_minute = p_minute,
    current_minute_extra = p_extra,
    live_updated_at = now(),
    live_source = 'manual'
  where id = p_fixture_id;
end;
$$;

create or replace function public.live_assert_team_on_fixture(p_fixture public.fixtures, p_team_id uuid)
returns void
language plpgsql
stable
as $$
begin
  if p_team_id is null or (p_team_id <> p_fixture.home_team_id and p_team_id <> p_fixture.away_team_id) then
    raise exception 'team_not_in_fixture' using errcode = 'P0001';
  end if;
end;
$$;

create or replace function public.live_assert_player_on_team(p_player_id uuid, p_team_id uuid)
returns void
language plpgsql
stable
as $$
declare
  pid uuid;
begin
  if p_player_id is null then
    return;
  end if;
  select id into pid from public.players where id = p_player_id and team_id = p_team_id and is_active;
  if pid is null then
    raise exception 'player_not_on_team' using errcode = 'P0001';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Public operations
-- ---------------------------------------------------------------------------

create or replace function public.live_prepare_match(p_fixture_id uuid, p_client_request_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid;
  fixture public.fixtures;
  existing jsonb;
begin
  actor := public.live_require_ops();
  existing := public.live_existing_request(p_fixture_id, p_client_request_id);
  if existing is not null then
    return existing;
  end if;
  fixture := public.live_lock_fixture(p_fixture_id);
  if fixture.status <> 'scheduled' then
    raise exception 'match_not_scheduled' using errcode = 'P0001';
  end if;
  perform public.live_touch_fixture(
    fixture.id, 'scheduled', coalesce(fixture.home_score, 0), coalesce(fixture.away_score, 0),
    fixture.started_at, fixture.second_half_started_at, fixture.ended_at, null, null
  );
  perform public.live_write_log(fixture.id, actor, 'prepare_match', null, p_client_request_id, '{}'::jsonb);
  return jsonb_build_object('ok', true, 'fixture_id', fixture.id, 'action', 'prepare_match');
end;
$$;

create or replace function public.live_start_match(p_fixture_id uuid, p_client_request_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid;
  fixture public.fixtures;
  existing jsonb;
  event_id uuid;
  kickoff timestamptz;
begin
  actor := public.live_require_ops();
  existing := public.live_existing_request(p_fixture_id, p_client_request_id);
  if existing is not null then
    return existing;
  end if;
  fixture := public.live_lock_fixture(p_fixture_id);
  if fixture.status <> 'scheduled' then
    raise exception 'match_already_started' using errcode = 'P0001';
  end if;
  if fixture.started_at is not null then
    raise exception 'match_already_started' using errcode = 'P0001';
  end if;
  kickoff := now();
  event_id := public.live_insert_event(
    fixture, actor, 'period_start', 0, null, null, null, null, 'MATCH_START', p_client_request_id,
    jsonb_build_object('period', 'first')
  );
  perform public.live_touch_fixture(
    fixture.id, 'live', coalesce(fixture.home_score, 0), coalesce(fixture.away_score, 0),
    kickoff, null, null, 0, null
  );
  perform public.live_write_log(fixture.id, actor, 'start_match', event_id, p_client_request_id, '{}'::jsonb);
  return jsonb_build_object('ok', true, 'fixture_id', fixture.id, 'event_id', event_id, 'action', 'start_match');
end;
$$;

create or replace function public.live_set_halftime(p_fixture_id uuid, p_client_request_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid;
  fixture public.fixtures;
  existing jsonb;
  event_id uuid;
begin
  actor := public.live_require_ops();
  existing := public.live_existing_request(p_fixture_id, p_client_request_id);
  if existing is not null then
    return existing;
  end if;
  fixture := public.live_lock_fixture(p_fixture_id);
  if fixture.status <> 'live' or fixture.second_half_started_at is not null then
    raise exception 'match_not_live_first_half' using errcode = 'P0001';
  end if;
  event_id := public.live_insert_event(
    fixture, actor, 'halftime', 45, null, null, null, null, 'HALFTIME', p_client_request_id, '{}'::jsonb
  );
  perform public.live_touch_fixture(
    fixture.id, 'halftime', coalesce(fixture.home_score, 0), coalesce(fixture.away_score, 0),
    fixture.started_at, fixture.second_half_started_at, fixture.ended_at, 45, null
  );
  perform public.live_write_log(fixture.id, actor, 'halftime', event_id, p_client_request_id, '{}'::jsonb);
  return jsonb_build_object('ok', true, 'fixture_id', fixture.id, 'event_id', event_id, 'action', 'halftime');
end;
$$;

create or replace function public.live_start_second_half(p_fixture_id uuid, p_client_request_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid;
  fixture public.fixtures;
  existing jsonb;
  event_id uuid;
  restart timestamptz;
begin
  actor := public.live_require_ops();
  existing := public.live_existing_request(p_fixture_id, p_client_request_id);
  if existing is not null then
    return existing;
  end if;
  fixture := public.live_lock_fixture(p_fixture_id);
  if fixture.status <> 'halftime' then
    raise exception 'match_not_halftime' using errcode = 'P0001';
  end if;
  restart := now();
  event_id := public.live_insert_event(
    fixture, actor, 'second_half', 45, null, null, null, null, 'SECOND_HALF', p_client_request_id, '{}'::jsonb
  );
  perform public.live_touch_fixture(
    fixture.id, 'live', coalesce(fixture.home_score, 0), coalesce(fixture.away_score, 0),
    fixture.started_at, restart, null, 45, null
  );
  perform public.live_write_log(fixture.id, actor, 'second_half', event_id, p_client_request_id, '{}'::jsonb);
  return jsonb_build_object('ok', true, 'fixture_id', fixture.id, 'event_id', event_id, 'action', 'second_half');
end;
$$;

create or replace function public.live_finish_match(p_fixture_id uuid, p_client_request_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid;
  fixture public.fixtures;
  existing jsonb;
  event_id uuid;
begin
  actor := public.live_require_ops();
  existing := public.live_existing_request(p_fixture_id, p_client_request_id);
  if existing is not null then
    return existing;
  end if;
  fixture := public.live_lock_fixture(p_fixture_id);
  if fixture.status not in ('live', 'halftime') then
    raise exception 'match_not_live' using errcode = 'P0001';
  end if;
  event_id := public.live_insert_event(
    fixture, actor, 'full_time', coalesce(fixture.current_minute, 90), fixture.current_minute_extra,
    null, null, null, 'FULL_TIME', p_client_request_id, '{}'::jsonb
  );
  perform public.live_touch_fixture(
    fixture.id, 'finished', coalesce(fixture.home_score, 0), coalesce(fixture.away_score, 0),
    fixture.started_at, fixture.second_half_started_at, now(),
    coalesce(fixture.current_minute, 90), fixture.current_minute_extra
  );
  perform public.live_write_log(fixture.id, actor, 'finish_match', event_id, p_client_request_id, '{}'::jsonb);
  return jsonb_build_object('ok', true, 'fixture_id', fixture.id, 'event_id', event_id, 'action', 'finish_match');
end;
$$;

create or replace function public.live_add_goal(
  p_fixture_id uuid,
  p_team_id uuid,
  p_player_id uuid default null,
  p_minute integer default null,
  p_extra_minute integer default null,
  p_client_request_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid;
  fixture public.fixtures;
  existing jsonb;
  event_id uuid;
  home integer;
  away integer;
begin
  actor := public.live_require_ops();
  existing := public.live_existing_request(p_fixture_id, p_client_request_id);
  if existing is not null then
    return existing;
  end if;
  fixture := public.live_lock_fixture(p_fixture_id);
  if fixture.status <> 'live' then
    raise exception 'match_not_live' using errcode = 'P0001';
  end if;
  perform public.live_assert_team_on_fixture(fixture, p_team_id);
  perform public.live_assert_player_on_team(p_player_id, p_team_id);
  home := coalesce(fixture.home_score, 0);
  away := coalesce(fixture.away_score, 0);
  if p_team_id = fixture.home_team_id then
    home := home + 1;
  else
    away := away + 1;
  end if;
  event_id := public.live_insert_event(
    fixture, actor, 'goal', p_minute, p_extra_minute, p_team_id, p_player_id, null, 'GOAL',
    p_client_request_id, jsonb_build_object('side', case when p_team_id = fixture.home_team_id then 'home' else 'away' end)
  );
  perform public.live_touch_fixture(
    fixture.id, 'live', home, away, fixture.started_at, fixture.second_half_started_at, null,
    p_minute, p_extra_minute
  );
  perform public.live_write_log(
    fixture.id, actor, 'add_goal', event_id, p_client_request_id,
    jsonb_build_object('team_id', p_team_id, 'player_id', p_player_id, 'minute', p_minute)
  );
  return jsonb_build_object('ok', true, 'fixture_id', fixture.id, 'event_id', event_id, 'home_score', home, 'away_score', away);
end;
$$;

create or replace function public.live_add_card(
  p_fixture_id uuid,
  p_team_id uuid,
  p_player_id uuid,
  p_card_type text,
  p_minute integer default null,
  p_extra_minute integer default null,
  p_client_request_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid;
  fixture public.fixtures;
  existing jsonb;
  event_id uuid;
  typed public.match_event_type;
  kind text;
begin
  actor := public.live_require_ops();
  existing := public.live_existing_request(p_fixture_id, p_client_request_id);
  if existing is not null then
    return existing;
  end if;
  if p_card_type not in ('yellow_card', 'red_card') then
    raise exception 'invalid_card_type' using errcode = 'P0001';
  end if;
  typed := p_card_type::public.match_event_type;
  kind := case when typed = 'red_card' then 'RED_CARD' else 'YELLOW_CARD' end;
  fixture := public.live_lock_fixture(p_fixture_id);
  if fixture.status <> 'live' then
    raise exception 'match_not_live' using errcode = 'P0001';
  end if;
  perform public.live_assert_team_on_fixture(fixture, p_team_id);
  perform public.live_assert_player_on_team(p_player_id, p_team_id);
  event_id := public.live_insert_event(
    fixture, actor, typed, p_minute, p_extra_minute, p_team_id, p_player_id, null, kind,
    p_client_request_id, '{}'::jsonb
  );
  perform public.live_touch_fixture(
    fixture.id, 'live', coalesce(fixture.home_score, 0), coalesce(fixture.away_score, 0),
    fixture.started_at, fixture.second_half_started_at, null, p_minute, p_extra_minute
  );
  perform public.live_write_log(
    fixture.id, actor, 'add_card', event_id, p_client_request_id,
    jsonb_build_object('card_type', p_card_type, 'player_id', p_player_id)
  );
  return jsonb_build_object('ok', true, 'fixture_id', fixture.id, 'event_id', event_id);
end;
$$;

create or replace function public.live_add_substitution(
  p_fixture_id uuid,
  p_team_id uuid,
  p_player_out_id uuid,
  p_player_in_id uuid,
  p_minute integer default null,
  p_extra_minute integer default null,
  p_client_request_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid;
  fixture public.fixtures;
  existing jsonb;
  event_id uuid;
begin
  actor := public.live_require_ops();
  existing := public.live_existing_request(p_fixture_id, p_client_request_id);
  if existing is not null then
    return existing;
  end if;
  fixture := public.live_lock_fixture(p_fixture_id);
  if fixture.status <> 'live' then
    raise exception 'match_not_live' using errcode = 'P0001';
  end if;
  if p_player_out_id is null or p_player_in_id is null or p_player_out_id = p_player_in_id then
    raise exception 'invalid_substitution' using errcode = 'P0001';
  end if;
  perform public.live_assert_team_on_fixture(fixture, p_team_id);
  perform public.live_assert_player_on_team(p_player_out_id, p_team_id);
  perform public.live_assert_player_on_team(p_player_in_id, p_team_id);
  event_id := public.live_insert_event(
    fixture, actor, 'substitution', p_minute, p_extra_minute, p_team_id, p_player_out_id, p_player_in_id,
    'SUBSTITUTION', p_client_request_id, jsonb_build_object('player_out', p_player_out_id, 'player_in', p_player_in_id)
  );
  perform public.live_touch_fixture(
    fixture.id, 'live', coalesce(fixture.home_score, 0), coalesce(fixture.away_score, 0),
    fixture.started_at, fixture.second_half_started_at, null, p_minute, p_extra_minute
  );
  perform public.live_write_log(fixture.id, actor, 'add_substitution', event_id, p_client_request_id, '{}'::jsonb);
  return jsonb_build_object('ok', true, 'fixture_id', fixture.id, 'event_id', event_id);
end;
$$;

create or replace function public.live_reverse_event(p_event_id uuid, p_client_request_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid;
  ev public.match_events;
  fixture public.fixtures;
  existing jsonb;
  home integer;
  away integer;
begin
  actor := public.live_require_super_admin();
  select * into ev from public.match_events where id = p_event_id for update;
  if not found then
    raise exception 'event_not_found' using errcode = 'P0002';
  end if;
  existing := public.live_existing_request(ev.fixture_id, p_client_request_id);
  if existing is not null then
    return existing;
  end if;
  if ev.reversed_at is not null then
    raise exception 'event_already_reversed' using errcode = 'P0001';
  end if;
  fixture := public.live_lock_fixture(ev.fixture_id);
  home := coalesce(fixture.home_score, 0);
  away := coalesce(fixture.away_score, 0);
  if ev.event_type = 'goal' and ev.team_id is not null then
    if ev.team_id = fixture.home_team_id then
      home := greatest(home - 1, 0);
    elsif ev.team_id = fixture.away_team_id then
      away := greatest(away - 1, 0);
    end if;
  end if;
  update public.match_events
  set reversed_at = now(), reversed_by = actor
  where id = ev.id;
  perform public.live_touch_fixture(
    fixture.id, fixture.status, home, away,
    fixture.started_at, fixture.second_half_started_at, fixture.ended_at,
    fixture.current_minute, fixture.current_minute_extra
  );
  perform public.live_write_log(
    fixture.id, actor, 'reverse_event', ev.id, p_client_request_id,
    jsonb_build_object('event_type', ev.event_type)
  );
  return jsonb_build_object('ok', true, 'fixture_id', fixture.id, 'event_id', ev.id, 'home_score', home, 'away_score', away);
end;
$$;

revoke all on function public.live_require_ops() from public;
revoke all on function public.live_require_super_admin() from public;
revoke all on function public.live_lock_fixture(uuid) from public;
revoke all on function public.live_existing_request(uuid, uuid) from public;
revoke all on function public.live_write_log(uuid, uuid, text, uuid, uuid, jsonb) from public;
revoke all on function public.live_insert_event(public.fixtures, uuid, public.match_event_type, integer, integer, uuid, uuid, uuid, text, uuid, jsonb) from public;
revoke all on function public.live_touch_fixture(uuid, public.fixture_status, integer, integer, timestamptz, timestamptz, timestamptz, integer, integer) from public;

grant execute on function public.live_prepare_match(uuid, uuid) to authenticated;
grant execute on function public.live_start_match(uuid, uuid) to authenticated;
grant execute on function public.live_set_halftime(uuid, uuid) to authenticated;
grant execute on function public.live_start_second_half(uuid, uuid) to authenticated;
grant execute on function public.live_finish_match(uuid, uuid) to authenticated;
grant execute on function public.live_add_goal(uuid, uuid, uuid, integer, integer, uuid) to authenticated;
grant execute on function public.live_add_card(uuid, uuid, uuid, text, integer, integer, uuid) to authenticated;
grant execute on function public.live_add_substitution(uuid, uuid, uuid, uuid, integer, integer, uuid) to authenticated;
grant execute on function public.live_reverse_event(uuid, uuid) to authenticated;
