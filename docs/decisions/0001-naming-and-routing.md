# 0001 — Project name and locale routing

**Status:** accepted · 2026-09-28

## Context

The MVP spec suggests the working slug `movement-journal` and a `src/app/[locale]/` folder.
The product owner named the product **Motion Within** (`motionwithin.me`, internal name `motion-within`).
The route list in the spec (§6) has no locale prefix (`/calendar`, `/programs`, …).

## Decision

- Slug, package name and Supabase `project_id` are `motion-within`.
- URLs have **no locale prefix**. `next-intl` runs without i18n routing: the locale comes from the
  `NEXT_LOCALE` cookie, which is set from `profiles.locale` on sign-in / profile change, and falls
  back to the browser's `Accept-Language` (Serbian for ex-YU languages, otherwise Serbian default).
- Message keys are type-checked (`src/types/next-intl.d.ts`); a unit test enforces that `sr` and `en`
  have identical keys and that Serbian is Latin script only.

## Consequences

- Links and bookmarks are language-neutral; switching language never changes URLs.
- Public, SEO-relevant pages (none in the MVP) would need locale routing later.
