-- Body measurements, progression suggestions, push notifications.

create table public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  measured_on date not null,
  weight_kg numeric(5, 2) check (weight_kg > 0 and weight_kg < 500),
  waist_cm numeric(5, 1) check (waist_cm > 0 and waist_cm < 300),
  chest_cm numeric(5, 1) check (chest_cm > 0 and chest_cm < 300),
  hips_cm numeric(5, 1) check (hips_cm > 0 and hips_cm < 300),
  upper_arm_cm numeric(5, 1) check (upper_arm_cm > 0 and upper_arm_cm < 150),
  thigh_cm numeric(5, 1) check (thigh_cm > 0 and thigh_cm < 200),
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, measured_on),
  constraint body_measurements_has_value check (
    coalesce(weight_kg, waist_cm, chest_cm, hips_cm, upper_arm_cm, thigh_cm) is not null
  )
);

create trigger body_measurements_set_updated_at
  before update on public.body_measurements
  for each row execute function public.set_updated_at();

create table public.progression_suggestions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  program_id uuid references public.programs (id) on delete cascade,
  block_exercise_id uuid references public.block_exercises (id) on delete set null,
  status public.suggestion_status not null default 'pending',
  suggestion_type text not null check (
    suggestion_type in ('increase_weight', 'harder_band', 'harder_trx', 'increase_reps', 'harder_variation', 'hold', 'reduce', 'return_easy')
  ),
  reason_code text not null,
  reason_payload jsonb not null default '{}',
  suggested_payload jsonb not null default '{}',
  generated_at timestamptz not null default now(),
  resolved_at timestamptz,
  snoozed_until timestamptz
);

create index progression_suggestions_owner_status_idx on public.progression_suggestions (owner_id, status);
create index progression_suggestions_exercise_id_idx on public.progression_suggestions (exercise_id);
-- At most one open suggestion per exercise in a program.
create unique index progression_suggestions_one_pending
  on public.progression_suggestions (owner_id, exercise_id, coalesce(program_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where status = 'pending';

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index push_subscriptions_owner_id_idx on public.push_subscriptions (owner_id) where revoked_at is null;

create table public.notification_preferences (
  owner_id uuid primary key references auth.users (id) on delete cascade,
  workout_reminders_enabled boolean not null default false,
  default_reminder_minutes_before integer not null default 60
    check (default_reminder_minutes_before between 0 and 1440),
  default_workout_time time not null default '18:00',
  quiet_hours_start time,
  quiet_hours_end time,
  updated_at timestamptz not null default now()
);

create trigger notification_preferences_set_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

-- Delivery log: the unique key makes reminder sending idempotent.
create table public.reminder_deliveries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  scheduled_workout_id uuid not null references public.scheduled_workouts (id) on delete cascade,
  reminder_at timestamptz not null,
  sent_at timestamptz not null default now(),
  success_count integer not null default 0,
  unique (scheduled_workout_id, reminder_at)
);

create index reminder_deliveries_owner_id_idx on public.reminder_deliveries (owner_id);

-- Now that profiles and notification_preferences exist, hook up signup.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
