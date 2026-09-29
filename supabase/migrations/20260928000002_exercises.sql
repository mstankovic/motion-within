-- Exercise library: system (read-only, translated) and user-owned exercises.

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id) on delete cascade,
  source public.exercise_source not null,
  slug text unique,
  name_sr text,
  name_en text,
  custom_name text check (custom_name is null or char_length(custom_name) between 1 and 120),
  description_sr text,
  description_en text,
  custom_description text check (custom_description is null or char_length(custom_description) <= 2000),
  tracking_mode public.tracking_mode not null,
  is_mobility boolean not null default false,
  is_active boolean not null default true,
  -- set when a user copies a system exercise
  copied_from_id uuid references public.exercises (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercises_source_consistency check (
    (
      source = 'system'
      and owner_id is null
      and slug is not null
      and name_sr is not null
      and name_en is not null
      and custom_name is null
    )
    or (
      source = 'user'
      and owner_id is not null
      and slug is null
      and custom_name is not null
    )
  )
);

create index exercises_owner_id_idx on public.exercises (owner_id);
create index exercises_tracking_mode_idx on public.exercises (tracking_mode);

create trigger exercises_set_updated_at
  before update on public.exercises
  for each row execute function public.set_updated_at();

create table public.exercise_muscles (
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  muscle_group_id uuid not null references public.muscle_groups (id) on delete restrict,
  role public.muscle_role not null,
  primary key (exercise_id, muscle_group_id)
);

create index exercise_muscles_muscle_group_id_idx on public.exercise_muscles (muscle_group_id);

create table public.exercise_equipment (
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  equipment_id uuid not null references public.equipment (id) on delete restrict,
  primary key (exercise_id, equipment_id)
);

create index exercise_equipment_equipment_id_idx on public.exercise_equipment (equipment_id);

-- Visible = system exercise or the caller's own exercise.
create or replace function public.can_read_exercise(p_exercise_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.exercises e
    where e.id = p_exercise_id
      and (e.owner_id is null or e.owner_id = (select auth.uid()))
  );
$$;

create or replace function public.owns_exercise(p_exercise_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.exercises e
    where e.id = p_exercise_id
      and e.owner_id = (select auth.uid())
  );
$$;

-- Copy a system (or own) exercise into a user-owned, editable exercise.
create or replace function public.copy_exercise(p_exercise_id uuid, p_locale text default 'sr')
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_src public.exercises;
  v_new_id uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select * into v_src from public.exercises where id = p_exercise_id;
  if not found then
    raise exception 'exercise_not_found' using errcode = 'P0002';
  end if;

  insert into public.exercises (
    owner_id, source, custom_name, custom_description, tracking_mode, is_mobility, copied_from_id
  )
  values (
    v_uid,
    'user',
    coalesce(
      v_src.custom_name,
      case when p_locale = 'en' then v_src.name_en else v_src.name_sr end
    ),
    coalesce(
      v_src.custom_description,
      case when p_locale = 'en' then v_src.description_en else v_src.description_sr end
    ),
    v_src.tracking_mode,
    v_src.is_mobility,
    v_src.id
  )
  returning id into v_new_id;

  insert into public.exercise_muscles (exercise_id, muscle_group_id, role)
  select v_new_id, muscle_group_id, role
  from public.exercise_muscles
  where exercise_id = v_src.id;

  insert into public.exercise_equipment (exercise_id, equipment_id)
  select v_new_id, equipment_id
  from public.exercise_equipment
  where exercise_id = v_src.id;

  return v_new_id;
end;
$$;
