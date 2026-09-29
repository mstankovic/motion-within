-- Row Level Security for every client-exposed table.
-- Base rule for private rows: auth.uid() is not null and auth.uid() = owner_id.

alter table public.muscle_groups enable row level security;
alter table public.equipment enable row level security;
alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.exercise_muscles enable row level security;
alter table public.exercise_equipment enable row level security;
alter table public.programs enable row level security;
alter table public.program_days enable row level security;
alter table public.workout_blocks enable row level security;
alter table public.block_exercises enable row level security;
alter table public.scheduled_workouts enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.session_exercises enable row level security;
alter table public.session_sets enable row level security;
alter table public.body_measurements enable row level security;
alter table public.progression_suggestions enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.reminder_deliveries enable row level security;

-- The app only ever talks to the database as a signed-in user.
revoke all on all tables in schema public from anon;
revoke execute on all functions in schema public from anon, public;
grant execute on all functions in schema public to authenticated, service_role;
-- Trigger/helper functions must not be callable as RPC.
revoke execute on function public.handle_new_user() from authenticated;
revoke execute on function public.set_updated_at() from authenticated;
revoke execute on function public.session_exercises_inherit_owner() from authenticated;
revoke execute on function public.session_sets_inherit_owner() from authenticated;
revoke execute on function public.workout_sessions_guard_status() from authenticated;
revoke execute on function public.workout_sessions_sync_schedule() from authenticated;

-- Reference data -------------------------------------------------------------

create policy "reference: read" on public.muscle_groups
  for select to authenticated using (true);

create policy "reference: read" on public.equipment
  for select to authenticated using (true);

-- Profiles -------------------------------------------------------------------

create policy "profiles: read own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

create policy "profiles: update own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Exercises ------------------------------------------------------------------

create policy "exercises: read system and own" on public.exercises
  for select to authenticated
  using (owner_id is null or (select auth.uid()) = owner_id);

create policy "exercises: insert own" on public.exercises
  for insert to authenticated
  with check (source = 'user' and (select auth.uid()) = owner_id);

create policy "exercises: update own" on public.exercises
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check (source = 'user' and (select auth.uid()) = owner_id);

create policy "exercises: delete own" on public.exercises
  for delete to authenticated
  using ((select auth.uid()) = owner_id);

create policy "exercise_muscles: read visible" on public.exercise_muscles
  for select to authenticated using (public.can_read_exercise(exercise_id));

create policy "exercise_muscles: write own" on public.exercise_muscles
  for all to authenticated
  using (public.owns_exercise(exercise_id))
  with check (public.owns_exercise(exercise_id));

create policy "exercise_equipment: read visible" on public.exercise_equipment
  for select to authenticated using (public.can_read_exercise(exercise_id));

create policy "exercise_equipment: write own" on public.exercise_equipment
  for all to authenticated
  using (public.owns_exercise(exercise_id))
  with check (public.owns_exercise(exercise_id));

-- Programs -------------------------------------------------------------------

create policy "programs: own" on public.programs
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "program_days: own" on public.program_days
  for all to authenticated
  using (public.owns_program(program_id))
  with check (public.owns_program(program_id));

create policy "workout_blocks: own" on public.workout_blocks
  for all to authenticated
  using (public.owns_program_day(program_day_id))
  with check (public.owns_program_day(program_day_id));

create policy "block_exercises: own" on public.block_exercises
  for all to authenticated
  using (public.owns_workout_block(workout_block_id))
  with check (
    public.owns_workout_block(workout_block_id)
    and public.can_read_exercise(exercise_id)
  );

-- Calendar & sessions --------------------------------------------------------

create policy "scheduled_workouts: own" on public.scheduled_workouts
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check (
    (select auth.uid()) = owner_id
    and (program_day_id is null or public.owns_program_day(program_day_id))
  );

create policy "workout_sessions: own" on public.workout_sessions
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "session_exercises: own" on public.session_exercises
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "session_sets: own" on public.session_sets
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

-- Tracking -------------------------------------------------------------------

create policy "body_measurements: own" on public.body_measurements
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "progression_suggestions: own" on public.progression_suggestions
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

-- Notifications --------------------------------------------------------------

create policy "push_subscriptions: own" on public.push_subscriptions
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "notification_preferences: read own" on public.notification_preferences
  for select to authenticated using ((select auth.uid()) = owner_id);

create policy "notification_preferences: update own" on public.notification_preferences
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

-- reminder_deliveries: written only by the service role (Edge Function).
create policy "reminder_deliveries: read own" on public.reminder_deliveries
  for select to authenticated using ((select auth.uid()) = owner_id);
