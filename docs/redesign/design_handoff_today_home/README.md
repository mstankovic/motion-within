# Handoff: Today (Home) screen — Motion Within

## Overview
Replaces the current `/calendar` first tab with a today-first Home screen at `/today`. Order of sections: header (date, greeting, context) → Today card (one state, one primary action) → This week card (count, segmented bar, 7-day strip, insight) → Up next list. `/calendar` and `/calendar/[date]` stay as the full schedule.

## About the design files
The HTML files in this folder are **design references**, not production code. Rebuild them in the existing Next.js + Tailwind v4 + next-intl codebase using its tokens (`src/app/globals.css`), `components/ui/*` (Button, Card, Badge, Skeleton, states), `features/calendar/*` (StatusIcon, WorkoutCta, WeekStrip, PlanWeekButton) and lucide-react icons. Don't copy inline styles; map every value below to the matching token.

- `HomeScreen.dc.html` — the interactive screen. Open it in a browser. Its logic class shows the state rules and copy for every state.
- `Home Redesign.dc.html` — the full board: critique, IA, all 9 states side by side, system rules, interaction notes, implementation plan.
- `support.js` — runtime only, needed to open the HTML files. Ignore it.

## Fidelity
**High fidelity.** Final colors, type, spacing and copy. Match them exactly using existing tokens.

## Layout (390 × 844 reference, fluid width)
- Screen bg `--color-bg` #f6f6f2. Gutter 20px. Vertical gap between zones 22px. Content bottom padding clears the bottom nav (~124px incl. safe area).
- Status bar area then content starts 10px below.

### 1. Header
- Eyebrow: date "Tuesday, 29 September" — 13px/18 700, uppercase, +0.06em, `--color-ink-muted` #5b6661.
- Greeting: "Good afternoon, {name}" (morning <12, afternoon <18, evening) — 30/36 800, −0.02em, ink #1b2421. No name → "Good afternoon".
- Context line: 15/22 500 ink-muted, `text-wrap: pretty`, 2px top margin. Copy per state (below).
- Gap 4px.

### 2. Today card (hero) — planned / in progress / completed
- Surface `--color-hero` #0c5a50, text #eef7f4. Radius 28 (`--radius-sheet`), padding 20 20 12, gap 18, `--shadow-raised` (0 2px 4px rgb(27 36 33/.06), 0 12px 32px rgb(27 36 33/.1)).
- Decorative 3 concentric rings, top-right (220px svg, r 108/80/52, stroke #eef7f4 7% opacity, 2px), offset right −70 top −80, aria-hidden.
- Row 1 (space-between): eyebrow 13/18 700 uppercase +0.06em #a9d3c9 — "Today · 18:00" | "In progress · since 18:04" (preceded by 8px coral `--color-accent-bright` #f08a66 pulsing dot, `animate-live`) | "Completed · 18:52" (preceded by 16px CircleCheck, stroke #5fcf85). Right: intensity pill, 28px tall, padding 0 11, radius full, bg rgba(238,247,244,.12), 13px 700.
- Title: workout name 28/34 800 −0.02em, `text-wrap: balance`.
- Meta: ListChecks 18px + "8 exercises" (planned) / "3 of 8 exercises done" (in progress) / "8 of 8 exercises done" (completed). 15/22 600 #cfe7e0. Gap 8.
- In progress only: progress bar 6px, radius 3, track rgba(238,247,244,.16), fill #f08a66 at done/total.
- Primary button, full width, 56px, radius 14, 16px 800, gap 10, icon 20px, active scale(.97):
  - Planned: "Start workout", bg `--color-accent` #e3714d, text #2a0f05, Play (filled).
  - In progress: "Continue workout", same colors, RotateCcw icon.
  - Completed: "View summary", bg #eef7f4, text #0a5249, ChartNoAxesColumn icon.
  - Offline: Start disabled, opacity .45.
- Secondary text button under it: "View workout" + ChevronRight 16, min-height 44, 15px 700 #a9d3c9, hover #eef7f4. Gap between buttons 2px.

### 2b. Today card — rest day
- bg `--color-brand-soft` #dcefe9, radius 28, padding 20, gap 16, no shadow.
- 44px white circle with Moon icon 22px #0a5249 + eyebrow "Today · Recovery" (#0a5249).
- Title "Rest day" 28/34 800 #0a5249. Body: "Recovery is part of your program. Your body adapts between sessions." 15/22 ink.
- Next-workout row: white, radius 18, padding 14 14 14 16, `--shadow-card`, date column 44px (weekday 12px 700 uppercase muted / day 20/24 800), text "Next workout · Tomorrow" 13px 700 #0a5249, title 16/22 700, meta 14/20 muted "Strong · 8 exercises · 18:00", ChevronRight 20 #66716c.
- Outline button "Add a workout for today" + Plus 18: min-height 48, border 1px #b9d9d0, radius 14, 15px 700 #0a5249.

### 2c. Today card — missed (a past `planned` workout this week)
- White surface, radius 28, padding 20 20 12, gap 16, shadow-raised.
- Flag pill: "Not logged · Monday", 28px, bg `--color-warning-soft` #fbefd4, text #8a5a00, CircleAlert 15.
- Title = workout name. Body: "Today is free in your plan. Move it here, or mark it as skipped so your week stays accurate."
- Primary "Move to today" (CalendarDays 20): 56px, bg brand #0f6e62, white, active #0a5249. Secondary text "Mark as skipped" (SkipForward 16), ink.

### 2d. Unplanned week (program exists, week empty)
- bg #dcefe9, radius 28, padding 20 20 12. Eyebrow "Starter program" (program name). Title "Plan your week". Body "Your program trains on Monday, Wednesday and Friday. Add those days to this week in one tap." Chips (32px, white, radius full, 14px 700): "Mon · Light", "Wed · Strong", "Fri · Mobility". Primary brand "Plan this week" → `plan_week()`. Secondary "Add a single workout".

### 2e. No active program
- Hero surface (as 2). Eyebrow "Get started", title "Set up your first program", body "The starter program has three days: light full body, stronger full body and mobility. You can change everything later." Primary coral "Use the starter program" → `create_starter_program()`. Secondary "Build my own" → Programs/new. Week card and Up next hidden.

### 3. This week card
- White, radius 20 (`--radius-card`), padding 16 12 14, gap 14, `--shadow-card` (0 1px 2px rgb(27 36 33/.04), 0 4px 16px rgb(27 36 33/.05)).
- Header row (padding 0 4): "This week" 17/24 800 (other weeks: "Week of 5 October") + range "28 Sep – 4 Oct" 13/18 muted. Right: "Today" pill (only when not current week; 36px, border 1px #deddd5, 13px 700), prev/next 44px round icon buttons (ChevronLeft/Right 20), hover bg #eeeee8.
- Count: "1" 28/32 800 + "of 4 workouts done" 15px 700 muted, baseline aligned, gap 6.
- Segmented bar: 6px, gap 4, radius 3, one segment per counted workout (skipped excluded). Colors: done #2f7d4a, live #e3714d, missed #e8c77a, planned #deddd5.
- Day strip: `<ol>` 7-col grid, gap 2. Tile: min-height 68, radius 14, border 1.5px, padding 6 0, gap 3. Weekday 12/16 700 muted, day 17/20 800 ink, 18px status slot. Today tile: bg #dcefe9, border #0f6e62, text #0a5249. Others transparent.
- Status marks (18px, no legend):
  - Completed: filled circle #2f7d4a with white check (2.6 stroke).
  - Planned: ring 2.6 stroke #0f6e62.
  - Started: filled #e3714d with #2a0f05 play triangle.
  - Not logged: circle fill #fbefd4, stroke #8a5a00, "!" mark.
  - Skipped: SkipForward #66716c, 2.4 stroke.
  - No workout: 4px dot #c9c8bf.
- Accessible name per tile: "Tuesday 29 September: Full body — Strong, Planned (today)".
- Insight (current week only, when data exists): top border 1px #eeeee8, padding-top 12, 32px circle #dcefe9 with TrendingUp 16 #0a5249, text 14/20 600, e.g. "Last week you completed all 4 planned workouts."

### 4. Up next
- Header row: "Up next" 17/24 800 + text link "Full schedule" + ChevronRight 16, 15px 700 brand, min-height 44.
- One white card, radius 20, shadow-card, rows divided by 1px #eeeee8. Max 3 future planned workouts (never today or past; on rest days the first one is already in the card, so skip it).
- Row: min-height 72, padding 14 14 14 16, gap 14. Date column 44px. Text: relative day 13/18 700 #0a5249 ("Tomorrow" / weekday), title 16/22 700, meta 14/20 muted "{focus} · {n} exercises · {time}". ChevronRight 20 #66716c. Active bg #eeeee8.

### Offline banner
Existing `OfflineBanner`, placed above header: bg #fbefd4, text #8a5a00, radius 14, padding 12 14, WifiOff 18, 14/20 600. Copy: "Offline. Your plan is saved on this phone; starting a workout needs a connection."

### Loading
Skeletons shaped like the final zones: hero 268px radius 28, week 196px radius 20, title bar 20×96 + list 144px radius 20. Colour `--color-surface-muted` #eeeee8. Errors reuse `ErrorView` with "Try again".

### Toast
Bottom 112px, inset 20, bg ink #1b2421, text #eef2ef, radius 14, padding 13 16, 14/20 600, enter 240ms `cubic-bezier(0.05,0.7,0.1,1)` from translateY(8px), auto-dismiss 2.4s.

### Bottom nav
Items: **Today** (House icon, `/today`, active also on `/calendar/*`), Programs, Progress, Profile. Active: 56×32 pill #dcefe9, icon 2.4 stroke, label 12px 700 #0a5249. Inactive: 12px 600 muted, 2px stroke. Bar bg white 90% + blur(20px) saturate(1.5), top hairline shadow 0 −1px 0 rgb(27 36 33/.06).

## State logic — Today card priority
Implement as a pure `deriveTodayState(workouts, today, openSession, activeProgram)` in `features/today/derive.ts`, with unit tests.
1. Open session anywhere (`getOpenSession`) → `in_progress`
2. Today has a planned workout (`pickTodayWorkout`) → `planned`
3. Past `planned` workout earlier this week → `missed`
4. Today's workout completed → `completed`
5. Today empty, future workouts exist → `rest`
6. Active program, week empty → `unplanned`
7. No active program → `no_program`

Context-line copy:
- planned: "One workout today, planned for {time}."
- in_progress: "You have a workout in progress. Pick up where you left off."
- completed: "Today's workout is done. {n} workouts left this week." (1 → "One workout")
- rest: "No workout today. Your next one is {tomorrow|weekday}."
- missed: "{Weekday}'s workout wasn't logged. You still have time this week."
- unplanned: "Nothing is planned for this week yet."
- no_program: "Set up a program to start planning your week."

## Interactions
- Start workout → `/workouts/[id]/start` (disabled offline).
- Continue workout → `/sessions/[id]`.
- View summary → the completed session.
- View workout / day tile / Up next row → `/calendar/[date]`.
- Move to today → `rescheduleWorkout(id, today)`, toast "Moved to today".
- Mark as skipped → `setSkipped(id, true)`, toast "Marked as skipped".
- Plan this week → `PlanWeekButton` / `plan_week()`, toast reuses `calendar.planWeekDone`.
- Week arrows → change only the week card; Today card and Up next stay on the current week.
- Full schedule → `/calendar`.

## Motion
Card entry uses the existing `enter` stagger (40ms). Today card cross-fades 240ms `ease-standard` when its state changes. A progress segment fills with `animate-draw` when a workout completes. The live dot uses `animate-live`. All motion follows the existing `prefers-reduced-motion` reset.

## Tokens used (all exist in globals.css)
hero #0c5a50 · accent #e3714d · accent-bright #f08a66 · brand #0f6e62 · brand-strong #0a5249 · brand-soft #dcefe9 · success #2f7d4a · warning-soft #fbefd4 / warning ink #8a5a00 · bg #f6f6f2 · surface #ffffff · surface-muted #eeeee8 · border #deddd5 · ink #1b2421 · ink-muted #5b6661 · ink-subtle #66716c.
Radii: 14 control, 18 inner row, 20 card, 28 sheet/hero, full pills.
Type: Manrope, `font-feature-settings: 'tnum'`. Scale 30/28/17/16/15/14/13/12. Minimum 12px. Use rem.
Spacing: 4pt grid. Gutter 20, zone gap 22, card inner gaps 14–18.
Touch targets ≥44px.

## i18n
Add `today.*` keys to `messages/en.json` and `sr.json`: greetings, context lines, "Up next", "Full schedule", "Not logged", "Rest day", "Move to today", "Mark as skipped", "View workout", insight. The first nav tab label is "Today" / "Danas". Serbian strings run ~20% longer, so no fixed heights or `nowrap` on text.

## Files to change
- `app/(app)/today/page.tsx` (new; same queries as `calendar/page.tsx` plus the previous week for the insight). `/` redirects here.
- `features/today/derive.ts` + tests.
- `features/today/{home-header,today-card,week-summary,week-segments,upcoming-list}.tsx`.
- `components/app/bottom-nav.tsx`.
- `messages/en.json`, `messages/sr.json`.

## Not in data yet (don't build unless asked)
- Estimated duration ("~50 min"). Hidden by default; it would need sets × (work + `rest_seconds`).
- Per-exercise progress for the in-progress card: count `session_exercises` with `status = completed`. If that isn't available, show "In progress" without the count and hide the bar.
