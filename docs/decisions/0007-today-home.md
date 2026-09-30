# 0007 — Today-first home

**Status:** accepted · 2026-09-29 · spec: `docs/redesign/design_handoff_today_home/README.md`
(visual reference `HomeScreen.dc.html`; board `docs/redesign/Design.pdf`)

- **`/today` is home** (`/`, sign-in, onboarding, finishing/leaving a workout and the PWA
  `start_url` go there). The first tab is "Today" (House icon) and stays active on `/calendar/*`,
  which remains the full schedule.
- **`/calendar` is only the schedule:** title "Schedule" with a back link to Today, week
  navigation, and all seven days in one list (status mark + status in words + time; empty days
  say "No workout"), each opening `/calendar/[date]`. "Plan this week" appears only for an empty
  week that isn't over. The Today card, notices, progress line, legend and strip moved to (or
  were superseded by) `/today`.
- **Zones:** header → Today card → This week → Up next, one file each in `features/today/`
  (`home-header`, `today-card`, `week-summary` + `week-segments`, `upcoming-list`). No program:
  week and Up next are hidden.
- **State rules** are pure in `features/today/derive.ts`:
  `deriveTodayState(workouts, today, openSession, activeProgram)`, unit-tested in the spec's
  priority order. `workouts` is this week plus a 28-day look-ahead (one query).
  Gap in the spec, filled: nothing today or later but the week has workouts → rest without the
  "Next workout" row.
- **Up next:** max three future planned workouts; on rest days the first one is already in the
  card, so it is skipped.
- **Exercise progress** counts `session_exercises.status <> 'pending'` (synced by the outbox; can
  lag offline). Without rows the card shows "In progress" and no bar, as the spec allows.
- **Tokens:** the spec lists colors as existing that were not in `globals.css`; they were added as
  named tokens (with dark values): `accent-bright`, `on-hero-soft`, `success-bright`,
  `warning-bar`, `dot`, `brand-line`, and `--radius-row` (18px). Motion: `animate-toast-in`,
  `animate-fill` (the spec's `animate-draw` is a stroke animation and cannot fill a bar segment).
- **Toast** (`components/ui/toast.tsx`, mounted in `Providers`) for Move to today, Mark as skipped
  and Plan this week.
- **App-wide:** 20px gutter and content 10px below the status bar in the `(app)` layout; the
  offline banner uses the spec's copy and style on every screen.
- **Serbian grammar:** weekday phrases use ICU `select` ("u sredu", "od srede").
- **Not built (per spec):** estimated duration.
