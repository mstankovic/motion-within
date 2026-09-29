# 0003 — Offline workout, service worker and reminders

**Status:** accepted · 2026-09-28

## Offline

- The active workout is a client component backed by IndexedDB (Dexie): a copy of the session and an
  ordered **outbox** of idempotent mutations (full-row upserts by client-known UUID, updates, deletes).
- Pure rules (`src/lib/offline/outbox-core.ts`): same-row updates coalesce into the pending entry,
  replay is strictly in order, a head waiting for backoff blocks later entries, conflicts/fatal errors
  are parked without blocking, retries back off exponentially (1 s → 60 s, max 8 attempts).
- On open, unsynced local edits win over the server copy.
- Starting a workout (server snapshot) and editing programs require a connection (per spec).
- A **hand-written `public/sw.js`** (no plugin, works with Turbopack) caches static assets
  cache-first and caches the HTML of `/sessions/*`, `/calendar` and workout start pages network-first,
  so an already-opened workout reopens offline. Cached private pages are cleared on the login page.

## Reminders

- The reminder due time is computed **at send time** from `planned_date` + `planned_time`
  (or the user's default time) in the profile time zone, minus the configured minutes. An explicit
  `scheduled_workouts.reminder_at` overrides it. This avoids recomputing stored timestamps whenever a
  workout, the time zone or preferences change.
- Idempotency: the Edge Function inserts into `reminder_deliveries` (unique
  `scheduled_workout_id, reminder_at`) **before** sending; overlapping cron runs cannot double-send.
- Reminders are sent within a 2-hour window after the due time and never during quiet hours.
- Expired subscriptions (404/410) are revoked automatically.
