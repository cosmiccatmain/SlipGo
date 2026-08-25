-- Slip Neighbors and Security data.
--
-- Neighbor profiles are personal information about real slip holders, so the
-- policies below are deliberately tight: a profile is readable only when its
-- owner opted in, and only by someone who holds a slip in the same marina.
-- Security data is marina-level and readable by anyone.

create extension if not exists "pgcrypto";

-- `create type` has no IF NOT EXISTS, so each enum is created through this
-- helper to keep the migration re-runnable.
create or replace function public.create_enum_if_absent(type_name text, labels text[])
returns void
language plpgsql
as $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = type_name and n.nspname = 'public'
  ) then
    execute format(
      'create type public.%I as enum (%s)',
      type_name,
      (select string_agg(quote_literal(label), ', ') from unnest(labels) as label)
    );
  end if;
end;
$$;

/* ---------------------------------------------------------------- */
/* Marinas and docks                                                 */
/* ---------------------------------------------------------------- */

create table if not exists public.marinas (
  slug            text primary key,
  name            text        not null,
  city            text        not null,
  state           text        not null,
  water_body      text        not null,
  lat             numeric(9,6) not null,
  lng             numeric(9,6) not null,
  slip_count      integer     not null check (slip_count >= 0),
  guest_slips     integer     not null default 0,
  vhf_channel     integer     not null default 16,
  phone           text,
  website         text,
  created_at      timestamptz not null default now()
);

create table if not exists public.docks (
  id                    text primary key,
  marina_slug           text        not null references public.marinas (slug) on delete cascade,
  name                  text        not null,
  slip_count            integer     not null check (slip_count > 0),
  slip_length_min_ft    integer     not null check (slip_length_min_ft > 0),
  slip_length_max_ft    integer     not null,
  gated                 boolean     not null default false,
  liveaboard_permitted  boolean     not null default false,
  monthly_rate_per_ft   numeric(6,2) not null,
  constraint docks_length_range check (slip_length_max_ft >= slip_length_min_ft)
);

create index if not exists docks_marina_slug_idx on public.docks (marina_slug);

/* ---------------------------------------------------------------- */
/* Slip tenancy — who actually holds a slip, and who may see profiles */
/* ---------------------------------------------------------------- */

create table if not exists public.slip_holders (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users (id) on delete cascade,
  dock_id      text        not null references public.docks (id) on delete cascade,
  slip_number  text        not null,
  started_on   date        not null default current_date,
  ended_on     date,
  unique (dock_id, slip_number, started_on)
);

create index if not exists slip_holders_user_idx on public.slip_holders (user_id);
create index if not exists slip_holders_dock_idx on public.slip_holders (dock_id);

/* ---------------------------------------------------------------- */
/* Slip Neighbors                                                    */
/* ---------------------------------------------------------------- */

select public.create_enum_if_absent(
  'boat_type',
  array['sailboat', 'powerboat', 'trawler', 'catamaran', 'sportfisher']
);
select public.create_enum_if_absent(
  'onboard_frequency',
  array['daily', 'weekly', 'monthly', 'seasonal']
);
select public.create_enum_if_absent(
  'profile_visibility',
  array['dock', 'marina', 'private']
);

create table if not exists public.neighbor_profiles (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid        not null references auth.users (id) on delete cascade,
  dock_id            text        not null references public.docks (id) on delete cascade,
  slip_number        text        not null,
  -- First name plus last initial. Never store or expose a full legal name here.
  display_name       text        not null,
  boat_name          text,
  boat_type          public.boat_type not null,
  boat_length_ft     integer     not null check (boat_length_ft between 8 and 300),
  liveaboard         boolean     not null default false,
  onboard_frequency  public.onboard_frequency not null,
  tenure_months      integer     not null default 0 check (tenure_months >= 0),
  traits             text[]      not null default '{}',
  verified           boolean     not null default false,
  visibility         public.profile_visibility not null default 'dock',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (user_id, dock_id)
);

create index if not exists neighbor_profiles_dock_idx
  on public.neighbor_profiles (dock_id)
  where visibility <> 'private';

/* ---------------------------------------------------------------- */
/* Security data                                                     */
/* ---------------------------------------------------------------- */

select public.create_enum_if_absent(
  'camera_coverage', array['none', 'entry-only', 'partial', 'full']
);
select public.create_enum_if_absent(
  'patrol_cadence', array['none', 'weekends', 'nightly', '24/7']
);
select public.create_enum_if_absent(
  'lighting_quality', array['poor', 'adequate', 'bright']
);
select public.create_enum_if_absent(
  'key_access', array['none', 'key', 'code', 'fob', 'fob+camera']
);

create table if not exists public.security_profiles (
  marina_slug                text primary key references public.marinas (slug) on delete cascade,
  slip_count                 integer not null check (slip_count > 0),
  gated_docks                boolean not null default false,
  key_access                 public.key_access not null default 'none',
  camera_count               integer not null default 0 check (camera_count >= 0),
  camera_coverage            public.camera_coverage not null default 'none',
  lighting                   public.lighting_quality not null default 'adequate',
  patrol                     public.patrol_cadence not null default 'none',
  staffed_hours_per_day      numeric(4,1) not null default 0
                               check (staffed_hours_per_day between 0 and 24),
  harbor_patrol_response_min integer check (harbor_patrol_response_min >= 0),
  fire_standpipes            boolean not null default false,
  extinguishers_on_dock      boolean not null default false,
  meets_nfpa_303             boolean not null default false,
  liveaboard_watch_program   boolean not null default false,
  last_audit_on              date,
  updated_on                 date not null default current_date
);

select public.create_enum_if_absent(
  'incident_type',
  array[
    'outboard-theft', 'dinghy-theft', 'electronics-theft', 'fuel-theft',
    'vandalism', 'trespass', 'vessel-break-in', 'dock-fire'
  ]
);
select public.create_enum_if_absent(
  'incident_severity', array['low', 'moderate', 'high']
);
select public.create_enum_if_absent(
  'incident_source', array['marina-report', 'harbor-patrol', 'member-report']
);

create table if not exists public.security_incidents (
  id           uuid primary key default gen_random_uuid(),
  marina_slug  text        not null references public.marinas (slug) on delete cascade,
  dock_id      text        references public.docks (id) on delete set null,
  -- Future-dated reports are rejected in the application layer; a CHECK here
  -- cannot reference current_date, which Postgres treats as non-immutable.
  occurred_on  date        not null,
  type         public.incident_type not null,
  severity     public.incident_severity not null,
  resolved     boolean     not null default false,
  source       public.incident_source not null,
  summary      text        not null default '',
  -- Set for member reports so a marina can follow up; never exposed by the API.
  reported_by  uuid        references auth.users (id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists security_incidents_marina_idx
  on public.security_incidents (marina_slug, occurred_on desc);

/* ---------------------------------------------------------------- */
/* Row level security                                                */
/* ---------------------------------------------------------------- */

alter table public.marinas            enable row level security;
alter table public.docks              enable row level security;
alter table public.slip_holders       enable row level security;
alter table public.neighbor_profiles  enable row level security;
alter table public.security_profiles  enable row level security;
alter table public.security_incidents enable row level security;

-- Marina, dock, and security data is public: it is what people shop on.
drop policy if exists "marinas are public" on public.marinas;
create policy "marinas are public" on public.marinas
  for select using (true);

drop policy if exists "docks are public" on public.docks;
create policy "docks are public" on public.docks
  for select using (true);

drop policy if exists "security profiles are public" on public.security_profiles;
create policy "security profiles are public" on public.security_profiles
  for select using (true);

drop policy if exists "security incidents are public" on public.security_incidents;
create policy "security incidents are public" on public.security_incidents
  for select using (true);

-- Slip holders can see their own tenancy rows only.
drop policy if exists "own tenancy" on public.slip_holders;
create policy "own tenancy" on public.slip_holders
  for select using (auth.uid() = user_id);

-- True when the current user currently holds a slip in the given marina.
create or replace function public.holds_slip_in_marina(target_marina text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.slip_holders sh
    join public.docks d on d.id = sh.dock_id
    where sh.user_id = auth.uid()
      and d.marina_slug = target_marina
      and (sh.ended_on is null or sh.ended_on >= current_date)
  );
$$;

-- True when the current user currently holds a slip on the given dock.
create or replace function public.holds_slip_on_dock(target_dock text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.slip_holders sh
    where sh.user_id = auth.uid()
      and sh.dock_id = target_dock
      and (sh.ended_on is null or sh.ended_on >= current_date)
  );
$$;

-- A neighbor profile is visible to its owner, to dockmates when shared at
-- "dock", and to anyone holding a slip in the marina when shared at "marina".
-- Profiles set to "private" are visible only to their owner.
drop policy if exists "neighbor profiles follow their visibility" on public.neighbor_profiles;
create policy "neighbor profiles follow their visibility" on public.neighbor_profiles
  for select using (
    auth.uid() = user_id
    or (
      visibility = 'dock'
      and public.holds_slip_on_dock(dock_id)
    )
    or (
      visibility = 'marina'
      and public.holds_slip_in_marina(
        (select d.marina_slug from public.docks d where d.id = neighbor_profiles.dock_id)
      )
    )
  );

drop policy if exists "slip holders manage their own profile" on public.neighbor_profiles;
create policy "slip holders manage their own profile" on public.neighbor_profiles
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and public.holds_slip_on_dock(dock_id)
  );

-- Members may file an incident report against a marina they hold a slip in.
-- Marina-reported and harbor-patrol entries are written by service-role jobs.
drop policy if exists "members report incidents" on public.security_incidents;
create policy "members report incidents" on public.security_incidents
  for insert
  with check (
    source = 'member-report'
    and auth.uid() = reported_by
    and public.holds_slip_in_marina(marina_slug)
  );
