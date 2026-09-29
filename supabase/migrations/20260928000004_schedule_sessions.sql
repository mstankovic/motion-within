-- Calendar (scheduled workouts) and the historical record of what was done (sessions).

create table public.scheduled_workouts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  program_day_id uuid references public.program_days (id) on delete set null,
  planned_date date not null,
  planned_time time,
  title text not null check (char_length(title) between 1 and 120),
  status public.scheduled_status not null default 'planned',
  reminder_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index scheduled_workouts_owner_date_idx on public.scheduled_workouts (owner_id, planned_date);
create index scheduled_workouts_program_day_id_idx on public.scheduled_workouts (program_day_id);
create index scheduled_workouts_reminder_idx on public.scheduled_workouts (reminder_at)
  where status = 'planned' and reminder_at is not null;

create trigger scheduled_workouts_set_updated_at
  before update on public.scheduled_workouts
  for each row execute function public.set_updated_at();

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  scheduled_workout_id uuid references public.scheduled_workouts (id) on delete set null,
  program_id uuid references public.programs (id) on delete set null,
  program_day_id uuid references public.program_days (id) on delete set null,
  title_snapshot text not null,
  status public.session_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  session_rpe smallint check (session_rpe between 1 and 10),
  energy_after smallint check (energy_after between 1 and 5),
  recovery_rating smallint check (recovery_rating between 1 and 5),
  notes text check (notes is null or char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_sessions_completed_at check (status <> 'completed' or completed_at is not null)
);

create index workout_sessions_owner_started_idx on public.workout_sessions (owner_id, started_at desc);
create index workout_sessions_owner_status_idx on public.workout_sessions (owner_id, status);
-- One live/finished session per scheduled workout.
create unique index workout_sessions_one_per_scheduled
  on public.workout_sessions (scheduled_workout_id)
  where scheduled_workout_id is not null and status <> 'abandoned';

create trigger workout_sessions_set_updated_at
  before update on public.workout_sessions
  for each row execute function public.set_updated_at();

create table public.session_exercises (
  id uuid primary key default gen_random_uuid(),
  -- denormalized for fast RLS; always copied from the parent session by trigger
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  session_id uuid not null references public.workout_sessions (id) on delete cascade,
  source_exercise_id uuid references public.exercises (id) on delete set null,
  source_block_exercise_id uuid references public.block_exercises (id) on delete set null,
  exercise_name_snapshot text not null,
  tracking_mode_snapshot public.tracking_mode not null,
  is_mobility_snapshot boolean not null default false,
  block_type_snapshot public.block_type not null default 'single',
  block_title_snapshot text,
  block_sort_order integer not null default 0,
  exercise_sort_order integer not null default 0,
  rounds_snapshot integer not null default 1 check (rounds_snapshot >= 1),
  target_sets_snapshot integer not null default 1 check (target_sets_snapshot >= 1),
  target_reps_min_snapshot integer,
  target_reps_max_snapshot integer,
  target_duration_seconds_snapshot integer,
  target_weight_kg_snapshot numeric(6, 2),
  target_band_label_snapshot text,
  target_trx_position_snapshot text,
  tempo_snapshot text,
  rest_seconds_snapshot integer,
  progression_step_kg_snapshot numeric(5, 2),
  instructions_snapshot text,
  plan_notes_snapshot text,
  status public.session_exercise_status not null default 'pending',
  pain_flag boolean not null default false,
  pain_note text check (pain_note is null or char_length(pain_note) <= 1000),
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index session_exercises_session_id_idx on public.session_exercises (session_id, block_sort_order, exercise_sort_order);
create index session_exercises_owner_exercise_idx on public.session_exercises (owner_id, source_exercise_id);

create trigger session_exercises_set_updated_at
  before update on public.session_exercises
  for each row execute function public.set_updated_at();

create table public.session_sets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  session_exercise_id uuid not null references public.session_exercises (id) on delete cascade,
  set_number integer not null check (set_number >= 1),
  is_warmup boolean not null default false,
  reps integer check (reps between 0 and 1000),
  duration_seconds integer check (duration_seconds between 0 and 86400),
  weight_kg numeric(6, 2) check (weight_kg between 0 and 1000),
  band_label text check (band_label is null or char_length(band_label) <= 60),
  trx_position text check (trx_position is null or char_length(trx_position) <= 60),
  rpe smallint check (rpe between 1 and 10),
  completed boolean not null default false,
  notes text check (notes is null or char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_exercise_id, set_number)
);

create index session_sets_owner_id_idx on public.session_sets (owner_id);

create trigger session_sets_set_updated_at
  before update on public.session_sets
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Integrity triggers
-- ---------------------------------------------------------------------------

-- Child rows inherit owner from the parent. RLS then rejects rows whose parent
-- belongs to someone else (owner_id would not equal auth.uid()).
create or replace function public.session_exercises_inherit_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select owner_id into new.owner_id from public.workout_sessions where id = new.session_id;
  return new;
end;
$$;

create trigger session_exercises_inherit_owner
  before insert or update of session_id, owner_id on public.session_exercises
  for each row execute function public.session_exercises_inherit_owner();

create or replace function public.session_sets_inherit_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select owner_id into new.owner_id from public.session_exercises where id = new.session_exercise_id;
  return new;
end;
$$;

create trigger session_sets_inherit_owner
  before insert or update of session_exercise_id, owner_id on public.session_sets
  for each row execute function public.session_sets_inherit_owner();

-- A completed session must never silently fall back to in_progress (e.g. a stale offline write).
create or replace function public.workout_sessions_guard_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'completed' and new.status = 'in_progress' then
    raise exception 'session_already_completed' using errcode = 'P0001';
  end if;
  if new.status = 'completed' and new.completed_at is null then
    new.completed_at = now();
  end if;
  return new;
end;
$$;

create trigger workout_sessions_guard_status
  before update of status on public.workout_sessions
  for each row execute function public.workout_sessions_guard_status();

-- Keep the calendar status in sync with the session.
create or replace function public.workout_sessions_sync_schedule()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.scheduled_workout_id is null then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.status = new.status then
    return new;
  end if;

  update public.scheduled_workouts
  set status = case new.status
    when 'in_progress' then 'in_progress'::public.scheduled_status
    when 'completed' then 'completed'::public.scheduled_status
    else 'planned'::public.scheduled_status
  end
  where id = new.scheduled_workout_id;

  return new;
end;
$$;

create trigger workout_sessions_sync_schedule
  after insert or update of status on public.workout_sessions
  for each row execute function public.workout_sessions_sync_schedule();

-- ---------------------------------------------------------------------------
-- RPC: start a session from a scheduled workout, snapshotting the plan.
-- Idempotent: returns the existing live/completed session if there is one.
-- ---------------------------------------------------------------------------

create or replace function public.start_session(p_scheduled_workout_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_sched public.scheduled_workouts;
  v_program_id uuid;
  v_locale text;
  v_session_id uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select * into v_sched
  from public.scheduled_workouts
  where id = p_scheduled_workout_id and owner_id = v_uid
  for update;

  if not found then
    raise exception 'scheduled_workout_not_found' using errcode = 'P0002';
  end if;

  select id into v_session_id
  from public.workout_sessions
  where scheduled_workout_id = p_scheduled_workout_id and status <> 'abandoned'
  limit 1;

  if v_session_id is not null then
    return v_session_id;
  end if;

  if v_sched.program_day_id is null then
    raise exception 'scheduled_workout_has_no_plan' using errcode = 'P0001';
  end if;

  select program_id into v_program_id from public.program_days where id = v_sched.program_day_id;
  select locale into v_locale from public.profiles where id = v_uid;

  insert into public.workout_sessions (owner_id, scheduled_workout_id, program_id, program_day_id, title_snapshot)
  values (v_uid, v_sched.id, v_program_id, v_sched.program_day_id, v_sched.title)
  returning id into v_session_id;

  with inserted as (
    insert into public.session_exercises (
      owner_id, session_id, source_exercise_id, source_block_exercise_id,
      exercise_name_snapshot, tracking_mode_snapshot, is_mobility_snapshot,
      block_type_snapshot, block_title_snapshot, block_sort_order, exercise_sort_order,
      rounds_snapshot, target_sets_snapshot, target_reps_min_snapshot, target_reps_max_snapshot,
      target_duration_seconds_snapshot, target_weight_kg_snapshot, target_band_label_snapshot,
      target_trx_position_snapshot, tempo_snapshot, rest_seconds_snapshot,
      progression_step_kg_snapshot, instructions_snapshot, plan_notes_snapshot
    )
    select
      v_uid, v_session_id, e.id, be.id,
      coalesce(e.custom_name, case when v_locale = 'en' then e.name_en else e.name_sr end),
      e.tracking_mode, e.is_mobility,
      b.block_type, b.title, b.sort_order, be.sort_order,
      b.rounds, be.target_sets, be.target_reps_min, be.target_reps_max,
      be.target_duration_seconds, be.target_weight_kg, be.target_band_label,
      be.target_trx_position, be.tempo, be.rest_seconds,
      be.progression_step_kg,
      coalesce(e.custom_description, case when v_locale = 'en' then e.description_en else e.description_sr end),
      be.notes
    from public.workout_blocks b
    join public.block_exercises be on be.workout_block_id = b.id
    join public.exercises e on e.id = be.exercise_id
    where b.program_day_id = v_sched.program_day_id
    returning id, block_type_snapshot, rounds_snapshot, target_sets_snapshot,
      target_weight_kg_snapshot, target_band_label_snapshot, target_trx_position_snapshot
  )
  insert into public.session_sets (owner_id, session_exercise_id, set_number, weight_kg, band_label, trx_position)
  select
    v_uid, i.id, n,
    i.target_weight_kg_snapshot, i.target_band_label_snapshot, i.target_trx_position_snapshot
  from inserted i
  cross join lateral generate_series(
    1,
    case when i.block_type_snapshot = 'circuit' then i.rounds_snapshot else i.target_sets_snapshot end
  ) as n;

  return v_session_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: history reads (security invoker → RLS applies)
-- ---------------------------------------------------------------------------

-- All sets of completed sessions for the given exercises (used for records and charts).
create or replace function public.exercise_completed_sets(p_exercise_ids uuid[])
returns table (
  exercise_id uuid,
  session_id uuid,
  session_exercise_id uuid,
  performed_at timestamptz,
  tracking_mode public.tracking_mode,
  set_number integer,
  reps integer,
  duration_seconds integer,
  weight_kg numeric,
  band_label text,
  trx_position text,
  rpe smallint,
  completed boolean,
  is_warmup boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    se.source_exercise_id, ws.id, se.id, ws.started_at, se.tracking_mode_snapshot,
    ss.set_number, ss.reps, ss.duration_seconds, ss.weight_kg, ss.band_label,
    ss.trx_position, ss.rpe, ss.completed, ss.is_warmup
  from public.session_exercises se
  join public.workout_sessions ws on ws.id = se.session_id
  join public.session_sets ss on ss.session_exercise_id = se.id
  where se.owner_id = (select auth.uid())
    and se.source_exercise_id = any (p_exercise_ids)
    and ws.status = 'completed'
  order by ws.started_at, se.id, ss.set_number;
$$;

-- Performances (one row per session exercise) of one exercise, newest first.
create or replace function public.exercise_performances(
  p_exercise_id uuid,
  p_limit integer default 30,
  p_before timestamptz default null
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(jsonb_agg(row_data order by performed_at desc), '[]'::jsonb)
  from (
    select
      ws.started_at as performed_at,
      jsonb_build_object(
        'session_exercise_id', se.id,
        'session_id', ws.id,
        'performed_at', ws.started_at,
        'session_title', ws.title_snapshot,
        'session_rpe', ws.session_rpe,
        'status', se.status,
        'pain_flag', se.pain_flag,
        'notes', se.notes,
        'tracking_mode', se.tracking_mode_snapshot,
        'target_sets', se.target_sets_snapshot,
        'target_reps_min', se.target_reps_min_snapshot,
        'target_reps_max', se.target_reps_max_snapshot,
        'target_duration_seconds', se.target_duration_seconds_snapshot,
        'target_weight_kg', se.target_weight_kg_snapshot,
        'target_band_label', se.target_band_label_snapshot,
        'target_trx_position', se.target_trx_position_snapshot,
        'sets', coalesce((
          select jsonb_agg(to_jsonb(ss) - 'owner_id' order by ss.set_number)
          from public.session_sets ss
          where ss.session_exercise_id = se.id
        ), '[]'::jsonb)
      ) as row_data
    from public.session_exercises se
    join public.workout_sessions ws on ws.id = se.session_id
    where se.owner_id = (select auth.uid())
      and se.source_exercise_id = p_exercise_id
      and ws.status = 'completed'
      and (p_before is null or ws.started_at < p_before)
    order by ws.started_at desc
    limit least(greatest(p_limit, 1), 200)
  ) t;
$$;

-- Most recent completed performance for each exercise, before a point in time.
create or replace function public.exercise_last_performances(
  p_exercise_ids uuid[],
  p_before timestamptz default null
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(jsonb_object_agg(exercise_id, row_data), '{}'::jsonb)
  from (
    select distinct on (se.source_exercise_id)
      se.source_exercise_id as exercise_id,
      jsonb_build_object(
        'session_exercise_id', se.id,
        'session_id', ws.id,
        'performed_at', ws.started_at,
        'status', se.status,
        'pain_flag', se.pain_flag,
        'sets', coalesce((
          select jsonb_agg(to_jsonb(ss) - 'owner_id' order by ss.set_number)
          from public.session_sets ss
          where ss.session_exercise_id = se.id
        ), '[]'::jsonb)
      ) as row_data
    from public.session_exercises se
    join public.workout_sessions ws on ws.id = se.session_id
    where se.owner_id = (select auth.uid())
      and se.source_exercise_id = any (p_exercise_ids)
      and ws.status = 'completed'
      and se.status = 'completed'
      and (p_before is null or ws.started_at < p_before)
    order by se.source_exercise_id, ws.started_at desc
  ) t;
$$;

-- ---------------------------------------------------------------------------
-- RPC: plan a week from the active program (skips days already planned).
-- ---------------------------------------------------------------------------

create or replace function public.plan_week(p_week_start date)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_count integer;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  insert into public.scheduled_workouts (owner_id, program_day_id, planned_date, title)
  select v_uid, d.id, p_week_start + (d.preferred_weekday - 1), d.title
  from public.program_days d
  join public.programs p on p.id = d.program_id
  where p.owner_id = v_uid
    and p.is_active
    and d.preferred_weekday is not null
    and not exists (
      select 1 from public.scheduled_workouts s
      where s.owner_id = v_uid
        and s.program_day_id = d.id
        and s.planned_date between p_week_start and p_week_start + 6
    );

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
