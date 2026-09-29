-- Programs are templates: program → days → blocks → block exercises.

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text check (description is null or char_length(description) <= 2000),
  is_active boolean not null default false,
  source public.program_source not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint programs_archived_not_active check (not (is_active and archived_at is not null))
);

create index programs_owner_id_idx on public.programs (owner_id);
-- At most one active program per user.
create unique index programs_one_active_per_owner on public.programs (owner_id) where is_active;

create trigger programs_set_updated_at
  before update on public.programs
  for each row execute function public.set_updated_at();

create table public.program_days (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text check (description is null or char_length(description) <= 2000),
  day_index integer not null check (day_index >= 0),
  preferred_weekday smallint check (preferred_weekday between 1 and 7),
  intensity public.program_intensity not null default 'custom',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index program_days_program_id_idx on public.program_days (program_id, day_index);

create trigger program_days_set_updated_at
  before update on public.program_days
  for each row execute function public.set_updated_at();

create table public.workout_blocks (
  id uuid primary key default gen_random_uuid(),
  program_day_id uuid not null references public.program_days (id) on delete cascade,
  block_type public.block_type not null default 'single',
  title text check (title is null or char_length(title) <= 120),
  rounds integer not null default 1 check (rounds between 1 and 20),
  sort_order integer not null check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workout_blocks_program_day_id_idx on public.workout_blocks (program_day_id, sort_order);

create trigger workout_blocks_set_updated_at
  before update on public.workout_blocks
  for each row execute function public.set_updated_at();

create table public.block_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_block_id uuid not null references public.workout_blocks (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  sort_order integer not null check (sort_order >= 0),
  target_sets integer not null default 1 check (target_sets between 1 and 20),
  target_reps_min integer check (target_reps_min >= 0),
  target_reps_max integer check (target_reps_max >= 0),
  target_duration_seconds integer check (target_duration_seconds >= 0),
  target_weight_kg numeric(6, 2) check (target_weight_kg >= 0),
  target_band_label text check (target_band_label is null or char_length(target_band_label) <= 60),
  target_trx_position text check (target_trx_position is null or char_length(target_trx_position) <= 60),
  tempo text check (tempo is null or char_length(tempo) <= 20),
  rest_seconds integer check (rest_seconds >= 0),
  progression_step_kg numeric(5, 2) check (progression_step_kg > 0),
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint block_exercises_reps_range check (
    target_reps_min is null or target_reps_max is null or target_reps_min <= target_reps_max
  )
);

create index block_exercises_workout_block_id_idx on public.block_exercises (workout_block_id, sort_order);
create index block_exercises_exercise_id_idx on public.block_exercises (exercise_id);

create trigger block_exercises_set_updated_at
  before update on public.block_exercises
  for each row execute function public.set_updated_at();

-- Ownership helpers for child tables (used by RLS).
create or replace function public.owns_program(p_program_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.programs p
    where p.id = p_program_id and p.owner_id = (select auth.uid())
  );
$$;

create or replace function public.owns_program_day(p_program_day_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.program_days d
    join public.programs p on p.id = d.program_id
    where d.id = p_program_day_id and p.owner_id = (select auth.uid())
  );
$$;

create or replace function public.owns_workout_block(p_block_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workout_blocks b
    join public.program_days d on d.id = b.program_day_id
    join public.programs p on p.id = d.program_id
    where b.id = p_block_id and p.owner_id = (select auth.uid())
  );
$$;

-- Atomically make one program the active one.
create or replace function public.activate_program(p_program_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if not exists (
    select 1 from public.programs
    where id = p_program_id and owner_id = v_uid and archived_at is null
  ) then
    raise exception 'program_not_found' using errcode = 'P0002';
  end if;

  update public.programs
  set is_active = false
  where owner_id = v_uid and is_active and id <> p_program_id;

  update public.programs
  set is_active = true
  where id = p_program_id;
end;
$$;

-- Deep-copy a program (days, blocks, exercises). The copy is never active.
create or replace function public.copy_program(p_program_id uuid, p_name text)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_new_program uuid;
  v_day record;
  v_new_day uuid;
  v_block record;
  v_new_block uuid;
begin
  if not exists (select 1 from public.programs where id = p_program_id and owner_id = v_uid) then
    raise exception 'program_not_found' using errcode = 'P0002';
  end if;

  insert into public.programs (owner_id, name, description, is_active, source)
  select v_uid, p_name, description, false, 'user'
  from public.programs where id = p_program_id
  returning id into v_new_program;

  for v_day in
    select * from public.program_days where program_id = p_program_id order by day_index
  loop
    insert into public.program_days (program_id, title, description, day_index, preferred_weekday, intensity)
    values (v_new_program, v_day.title, v_day.description, v_day.day_index, v_day.preferred_weekday, v_day.intensity)
    returning id into v_new_day;

    for v_block in
      select * from public.workout_blocks where program_day_id = v_day.id order by sort_order
    loop
      insert into public.workout_blocks (program_day_id, block_type, title, rounds, sort_order)
      values (v_new_day, v_block.block_type, v_block.title, v_block.rounds, v_block.sort_order)
      returning id into v_new_block;

      insert into public.block_exercises (
        workout_block_id, exercise_id, sort_order, target_sets, target_reps_min, target_reps_max,
        target_duration_seconds, target_weight_kg, target_band_label, target_trx_position,
        tempo, rest_seconds, progression_step_kg, notes
      )
      select
        v_new_block, exercise_id, sort_order, target_sets, target_reps_min, target_reps_max,
        target_duration_seconds, target_weight_kg, target_band_label, target_trx_position,
        tempo, rest_seconds, progression_step_kg, notes
      from public.block_exercises
      where workout_block_id = v_block.id;
    end loop;
  end loop;

  return v_new_program;
end;
$$;
