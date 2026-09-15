-- Phase 0 identity foundation.
-- RLS default-deny: no policy means no access.

create type public.app_role as enum (
  'user',
  'moderator',
  'editor',
  'admin',
  'super_admin'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_path text,
  preferred_locale text not null default 'tr',
  theme_preference text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint profiles_display_name_len check (char_length(display_name) between 3 and 24),
  constraint profiles_locale_check check (preferred_locale = 'tr'),
  constraint profiles_theme_check check (theme_preference in ('system', 'light', 'dark'))
);

create unique index profiles_display_name_lower_idx
  on public.profiles (lower(display_name))
  where deleted_at is null;

create table public.user_roles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.app_role not null,
  granted_by uuid references public.profiles (id),
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

create index user_roles_role_idx on public.user_roles (role);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  generated_name text;
begin
  generated_name := 'Taraftar' || substr(replace(new.id::text, '-', ''), 1, 8);

  insert into public.profiles (id, display_name)
  values (new.id, generated_name);

  insert into public.user_roles (user_id, role)
  values (new.id, 'user');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

-- Current-user role check only. Never accepts a target user_id.
create or replace function public.has_role(p_role public.app_role)
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
      and role = p_role
  );
$$;

revoke all on function public.has_role(public.app_role) from public;
grant execute on function public.has_role(public.app_role) to authenticated;

revoke all on function public.handle_new_user() from public;
revoke all on function public.set_updated_at() from public;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

revoke all on table public.profiles from public, anon, authenticated;
revoke all on table public.user_roles from public, anon, authenticated;

grant select (
  id,
  display_name,
  avatar_path,
  preferred_locale,
  theme_preference,
  created_at
) on table public.profiles to authenticated;

grant update (
  display_name,
  avatar_path,
  preferred_locale,
  theme_preference
) on table public.profiles to authenticated;

grant select on table public.user_roles to authenticated;

create policy profiles_select_authenticated
  on public.profiles
  for select
  to authenticated
  using (deleted_at is null);

create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid() and deleted_at is null)
  with check (id = auth.uid() and deleted_at is null);

create policy user_roles_select_own
  on public.user_roles
  for select
  to authenticated
  using (user_id = auth.uid());

-- Intentionally no insert/update/delete policies on user_roles.
-- Intentionally no insert/delete policies on profiles (trigger-owned).
