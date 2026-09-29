# 0004 — UI stack choices

**Status:** accepted · 2026-09-28

- **No React Hook Form.** Forms are small and mostly controlled inputs with instant feedback; they use
  React state + Zod schemas shared with server actions (validation runs on client, server action
  and database constraints). RHF can be added if a large form appears.
- **Server Components + Server Actions** for read-heavy screens and mutations (followed by
  `revalidatePath` / `router.refresh`). **TanStack Query** is used where the client fetches directly
  (exercise picker). The active workout is a client-side experience with IndexedDB.
- **Radix primitives** only where they add accessibility value (dialog/sheet, slot); other controls
  are native elements styled with Tailwind (native `select`/`date`/`time` work best on phones).
- **Recharts** is loaded with `next/dynamic` only on progress screens; every chart has a text summary.
- No global state manager.
