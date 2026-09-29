# 0006 — Passkeys for quick sign-in

**Status:** accepted · 2026-09-29

- **Optional, on top of the email code.** Accounts are always created with an email code
  (0005); a passkey (WebAuthn: Face ID, Touch ID, fingerprint or device PIN) is a faster way back
  in after sign-out or on a device where the passkey is synced (iCloud Keychain / Google Password
  Manager). The email code always remains as the fallback.
- **Supabase Auth passkeys** (`auth.registerPasskey()`, `auth.signInWithPasskey()`,
  `auth.passkey.list/update/delete`) run in the browser client, which writes the session cookie;
  the `completePasskeySignIn` server action then sets the locale cookie and redirects like the
  code flow.
- **Where it shows up**
  - Calendar: a one-time card "Sign in with one tap" on devices with a platform authenticator
    (`isUserVerifyingPlatformAuthenticatorAvailable`). "Not now" / success is remembered per
    device in `localStorage` (`mw.passkey`).
  - Login: a "Quick sign-in" button where a passkey was created on this device; elsewhere
    (e.g. a passkey synced from another device) passkey suggestions in the email field's autofill
    (Conditional UI, `autocomplete="username webauthn"`). Only one WebAuthn request may be open,
    so autofill is not started when the button is shown.
  - Profile → "Quick sign-in": list (named after the device), add this device, remove.
- **Relying party is the domain.** Local: `rp_id = "localhost"`, origin `http://localhost:3000`.
  Production: `motionwithin.me`. Changing the domain invalidates existing passkeys (users fall
  back to the email code).
- **Tests:** unit tests for error classification and device names; Playwright e2e uses a Chromium
  virtual authenticator (CDP `WebAuthn.addVirtualAuthenticator`) for enable → list → sign in.
