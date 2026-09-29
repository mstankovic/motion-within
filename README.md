# Motion Within

**Rediscover the movement within you.** · _Ponovo pronađi pokret u sebi._
Train. Recover. Progress. — [motionwithin.me](https://motionwithin.me)

Mobile-first PWA za planiranje treninga i praćenje napretka: nedeljni kalendar, programi
(single / superset / circuit), aktivni trening koji radi i bez mreže, istorija i lični rekordi,
telesne mere, transparentni predlozi progresije i podsetnici. Srpski (latinica) i engleski.

> Aplikacija služi za planiranje i praćenje aktivnosti i ne predstavlja medicinski savet.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript strict · Tailwind CSS 4 · Radix ·
next-intl · TanStack Query · Zod · Recharts · date-fns/Intl ·
Dexie (IndexedDB) · Supabase (Postgres, Auth, RLS, Edge Functions, Cron) · Web Push (VAPID) ·
Vitest · Testing Library · Playwright.

## Preduslovi

- Node.js ≥ 20.9 (razvijano na 24), pnpm 10
- Docker Desktop (za lokalni Supabase)

## Instalacija i lokalno pokretanje

```bash
pnpm install
pnpm db:start            # lokalni Supabase (Docker); prvi put povlači image-e
pnpm db:status           # prikazuje URL i ključeve
cp .env.example .env.local
# popuni NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY i SUPABASE_SECRET_KEY iz `pnpm db:status`
pnpm vapid               # opciono: generiše VAPID ključeve za push
pnpm dev                 # http://localhost:3000
```

Lokalno je potvrda emaila isključena. Mejlovi (reset lozinke) se vide u Mailpit-u:
http://127.0.0.1:54324. Supabase Studio: http://127.0.0.1:54323.

## Baza: migracije, seed, tipovi

| Komanda                        | Šta radi                                                           |
| ------------------------------ | ------------------------------------------------------------------ |
| `pnpm db:reset`                | briše lokalnu bazu, primenjuje sve migracije i `supabase/seed.sql` |
| `pnpm db:types`                | generiše `src/types/database.ts` iz lokalne šeme                   |
| `supabase migration new <ime>` | nova migracija u `supabase/migrations/`                            |

Migracije (`supabase/migrations/`):

1. `foundation` — enumi, referentne tabele, `profiles`
2. `exercises` — biblioteka vežbi, `copy_exercise()`
3. `programs` — programi, dani, blokovi, vežbe u bloku, `activate_program()`, `copy_program()`
4. `schedule_sessions` — kalendar, sesije, snapshot (`start_session()`), history RPC-ovi, `plan_week()`
5. `tracking_notifications` — mere, predlozi progresije, push pretplate, podešavanja, log isporuka, signup trigger
6. `rls` — Row Level Security za svaku tabelu
7. `system_content` — mišićne grupe, oprema, 50 dvojezičnih vežbi i `create_starter_program()`

Sistemski sadržaj je u migraciji (a ne u `seed.sql`) da bi postojao i u produkciji — vidi
`docs/decisions/0002`. `seed.sql` namerno ne pravi lažne korisnike.

## Testovi i provere

```bash
pnpm lint
pnpm typecheck
pnpm test               # unit (progresija, rekordi, datumi, i18n, outbox, reducer…)
pnpm test:integration   # nad lokalnim Supabase-om: RLS, snapshot, aktivacija, pain flag…
pnpm test:e2e           # Playwright, iPhone 13 i Pixel 7 viewport (pokreće `pnpm dev` ako ne radi)
pnpm build
```

E2E pokriva: registracija → onboarding → kalendar; kreiranje programa → planiranje;
trening sa unosom serija, **prekidom mreže** i sinhronizacijom → završetak → istorija;
unos težine → grafikon; korisnik A ne može da otvori sesiju korisnika B.

## PWA i Web Push (VAPID)

- Manifest: `src/app/manifest.ts`, ikone u `public/icons/`, service worker `public/sw.js`
  (aktivan samo u produkcionom build-u; za dev postavi `NEXT_PUBLIC_SW_IN_DEV=1`).
- `pnpm vapid` ispisuje par ključeva:
  - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` → `.env.local` / Vercel
  - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` → secrets Edge Function-a
- Lokalno testiranje funkcije:

  ```bash
  # supabase/functions/.env: VAPID_* i CRON_SECRET (fajl je u .gitignore)
  pnpm exec supabase functions serve send-reminders --env-file supabase/functions/.env --no-verify-jwt
  curl -X POST -H "Authorization: Bearer $CRON_SECRET" http://127.0.0.1:54321/functions/v1/send-reminders
  ```

- Na iOS-u Web Push radi samo kada je aplikacija dodata na početni ekran (iOS 16.4+).

## Deployment

### Supabase Cloud

```bash
pnpm exec supabase login
pnpm exec supabase link --project-ref <ref>
pnpm exec supabase db push                       # primenjuje migracije
pnpm exec supabase functions deploy send-reminders --no-verify-jwt
pnpm exec supabase secrets set CRON_SECRET=<dug-random> VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:hello@motionwithin.me
```

U Auth podešavanjima: Site URL `https://motionwithin.me`, redirect URL
`https://motionwithin.me/auth/callback`, uključi potvrdu emaila i podesi SMTP.

Cron (SQL editor, jednom po projektu) — poziva funkciju na 5 minuta:

```sql
select vault.create_secret('<CRON_SECRET>', 'reminders_cron_secret');
select cron.schedule(
  'send-workout-reminders',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://<ref>.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'reminders_cron_secret')
    )
  );
  $$
);
```

(Potrebne ekstenzije `pg_cron` i `pg_net`: Database → Extensions.)

### Vercel

Poveži GitHub repozitorijum i postavi env promenljive:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`,
`NEXT_PUBLIC_VAPID_PUBLIC_KEY`. Service role / secret ključ **nikad** ne ide u Next.js aplikaciju.

## Struktura

```text
src/
  app/                 rute (App Router); (auth), (app) sa donjom navigacijom, sessions/, workouts/
  components/ui|app    UI primitive i shell
  features/            domeni: auth, calendar, programs, exercises, workout-session,
                       progression, progress, measurements, notifications, profile
  lib/                 supabase klijenti, offline (Dexie + outbox), dates, i18n, validation
  messages/            sr.json, en.json
supabase/              config, migrations, seed.sql, functions/send-reminders
tests/                 integration/ (Vitest + Supabase), e2e/ (Playwright)
docs/decisions/        ADR-ovi
```

Poslovna pravila su čiste funkcije sa testovima: `features/progression/engine.ts`,
`features/progress/records.ts`, `features/progress/stats.ts`, `features/workout-session/reducer.ts`,
`lib/offline/outbox-core.ts`, `supabase/functions/_shared/reminders.ts`.

## Brisanje naloga (privatni MVP)

Ručni postupak: u Supabase Studio → Authentication → Users obriši korisnika. Sve tabele imaju
`on delete cascade` na `auth.users`, pa se brišu svi podaci korisnika.

## Poznata ograničenja MVP-a

- Započinjanje treninga, uređivanje programa i biblioteke zahtevaju mrežu; offline radi aktivni
  trening koji je već otvoren (unos, izmene, završetak, sinhronizacija posle reconnecta).
- Istovremene offline izmene iste sesije na više uređaja nisu podržane (poslednja izmena pobeđuje;
  završena sesija se ne vraća u tok).
- Lični rekordi i grafikoni se računaju iz kompletne istorije vežbe na zahtev — dovoljno za ličnu
  upotrebu, za velike istorije treba materijalizacija.
- Nema tajmera (po specifikaciji), nema tamne teme, nema brisanja naloga iz aplikacije.
- Progresija trajanja je isključena (MVP); mobilnost se nikad automatski ne progresira.
- Push isporuka je testirana do slanja ka push servisu; stvarni prijem treba proveriti na telefonu.
