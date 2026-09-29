@AGENTS.md

# Motion Within

Product/engineering brief: see README and `docs/decisions/`. Mobile-first PWA, Serbian (Latin) + English.

- Check before finishing a change: `pnpm lint && pnpm typecheck && pnpm test`; DB changes also
  `pnpm test:integration` (local Supabase must be running: `pnpm db:start`).
- Every schema change is a new migration in `supabase/migrations/`, then `pnpm db:types`.
- All UI text goes through `src/messages/{sr,en}.json` (keys are type-checked; both files must match).
- Business rules stay pure and tested: progression engine, records, stats, workout reducer, outbox.
- Never expose the Supabase secret/service key to the browser; RLS on every table.
- Next.js 16: `proxy.ts` (not middleware), async `params`/`cookies`, Turbopack.
