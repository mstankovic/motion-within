# 0002 — Data model details beyond the spec

**Status:** accepted · 2026-09-28

1. **System content lives in migrations**, not `seed.sql` (`20260928000007_system_content.sql`):
   muscle groups, equipment, 50 bilingual exercises and the `create_starter_program()` factory must
   exist in every environment, and `seed.sql` only runs locally.
2. **`scheduled_workouts.completed_session_id` is omitted.** The link is
   `workout_sessions.scheduled_workout_id` with a partial unique index (one non-abandoned session per
   scheduled workout). Status is kept in sync by a trigger, avoiding a cyclic FK.
3. **`owner_id` is denormalised onto `session_exercises` and `session_sets`** so offline upserts and RLS
   are a simple `owner_id = auth.uid()`. A `BEFORE` trigger always copies the owner from the parent,
   so a row pointing at someone else's parent fails the RLS check. Program child tables keep
   parent-based checks through `security definer` helper functions.
4. **Extra columns:** `profiles.preferred_weekdays` (onboarding), `scheduled_workouts.planned_time`,
   `exercises.copied_from_id`, snapshot columns `is_mobility_snapshot`,
   `progression_step_kg_snapshot`, `plan_notes_snapshot`, `progression_suggestions.block_exercise_id`
   and `snoozed_until`, `notification_preferences.default_workout_time`, and a
   `reminder_deliveries` log.
5. **Enums** are Postgres enums (strictly typed in generated TS types).
6. A completed session can never go back to `in_progress` (trigger raises
   `session_already_completed`); the client shows this as a sync conflict.

## Consequences

Generated types (`pnpm db:types`) must be refreshed after every migration.
