# 0005 — Passwordless sign-in (email code)

**Status:** accepted · 2026-09-29

- **One screen, no passwords.** `/login` asks for an email, Supabase sends a 6-digit code
  (`signInWithOtp`, `shouldCreateUser: true`), the user types it (`verifyOtp`, type `email`). The first
  sign-in creates the account; the app layout then routes new users to onboarding (which asks for
  the name). Register / forgot / reset-password screens are gone.
- **Code, not magic link.** An installed PWA on iOS has its own cookie jar: a link opened from the
  Mail app lands in Safari, not in the app. Typing a code keeps the session inside the PWA.
  `autocomplete="one-time-code"` lets iOS/Android offer the code from Mail; the form submits itself
  once all digits are in.
- **Email template** `supabase/templates/otp.html` is used for both `magic_link` (existing users) and
  `confirmation` (new users) and shows `{{ .Token }}`; language comes from `user_metadata.locale`
  (set at first sign-in). The cloud project needs the same templates.
- **Throttling.** Codes expire after 15 min. Server allows a new code per address after 10 s (short,
  so sign-out → sign-in works right away); the UI offers "send again" after 60 s. Captcha (Turnstile)
  is the next step if abuse appears.
- **Staying signed in.** Sessions are cookie-based (`@supabase/ssr`, 400-day cookie), the proxy
  refreshes the access token, refresh tokens do not expire and no `[auth.sessions]` timebox is set —
  users sign in once per device until they sign out.
- **Biometrics:** optional passkeys on top of the email code, see `0006-passkeys.md`.
