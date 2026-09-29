-- Motion Within — foundation: shared helpers, enums, reference tables, profiles.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.tracking_mode as enum (
  'reps',
  'reps_weight',
  'reps_band',
  'reps_trx',
  'duration',
  'reps_duration'
);

create type public.exercise_source as enum ('system', 'user');
create type public.muscle_role as enum ('primary', 'secondary');
create type public.program_source as enum ('starter', 'user');
create type public.program_intensity as enum ('light', 'strong', 'mobility', 'custom');
create type public.block_type as enum ('single', 'superset', 'circuit');
create type public.scheduled_status as enum ('planned', 'in_progress', 'completed', 'skipped');
create type public.session_status as enum ('in_progress', 'completed', 'abandoned');
create type public.session_exercise_status as enum ('pending', 'completed', 'skipped');
create type public.suggestion_status as enum ('pending', 'accepted', 'edited', 'dismissed', 'snoozed');

-- ---------------------------------------------------------------------------
-- Reference data (read-only for clients)
-- ---------------------------------------------------------------------------

create table public.muscle_groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_sr text not null,
  name_en text not null
);

create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_sr text not null,
  name_en text not null
);

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) <= 60),
  locale text not null default 'sr' check (locale in ('sr', 'en')),
  timezone text not null default 'Europe/Podgorica',
  unit_system text not null default 'metric' check (unit_system = 'metric'),
  week_starts_on smallint not null default 1 check (week_starts_on between 0 and 6),
  goals text[] not null default '{}'
    check (goals <@ array['conditioning', 'strength', 'weight_loss', 'mobility']::text[]),
  -- ISO weekdays: 1 = Monday … 7 = Sunday
  preferred_weekdays smallint[] not null default '{}'
    check (preferred_weekdays <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]),
  onboarding_completed boolean not null default false,
  safety_notice_acknowledged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Profile is created from the trusted auth.users row, never from a client-supplied id.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_locale text := new.raw_user_meta_data ->> 'locale';
  v_name text := nullif(trim(new.raw_user_meta_data ->> 'display_name'), '');
begin
  insert into public.profiles (id, display_name, locale)
  values (
    new.id,
    left(v_name, 60),
    case when v_locale in ('sr', 'en') then v_locale else 'sr' end
  );

  insert into public.notification_preferences (owner_id)
  values (new.id);

  return new;
end;
$$;
