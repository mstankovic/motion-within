/** Browser-side passkey helpers. Pure functions are unit-tested; the rest touch browser APIs only. */

export type PasskeyErrorKind = "cancelled" | "aborted" | "expired" | "alreadyRegistered" | "failed";

type MaybeError = { code?: unknown; name?: unknown; cause?: unknown } | null | undefined;

/** Maps Supabase/WebAuthn errors to what the UI should do with them. */
export function classifyPasskeyError(error: MaybeError): PasskeyErrorKind {
  const code = typeof error?.code === "string" ? error.code : undefined;
  const cause = error?.cause as MaybeError;
  const name = typeof cause?.name === "string" ? cause.name : error?.name;
  if (code === "ERROR_CEREMONY_ABORTED" || name === "AbortError") return "aborted";
  if (code === "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED") return "alreadyRegistered";
  if (code === "webauthn_challenge_expired") return "expired";
  // The user closed the system sheet, or the prompt timed out.
  if (name === "NotAllowedError") return "cancelled";
  return "failed";
}

/** Short label for the passkey list ("iPhone", "Mac", ...). */
export function deviceName(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes("iphone")) return "iPhone";
  if (ua.includes("ipad")) return "iPad";
  if (ua.includes("android")) return "Android";
  if (ua.includes("cros")) return "Chromebook";
  if (ua.includes("mac os") || ua.includes("macintosh")) return "Mac";
  if (ua.includes("windows")) return "Windows";
  if (ua.includes("linux")) return "Linux";
  return "Passkey";
}

export type PasskeySupport = { platform: boolean; autofill: boolean };

/** Whether this device can create/use a passkey with Face ID, Touch ID, fingerprint or PIN. */
export async function detectPasskeySupport(): Promise<PasskeySupport> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) {
    return { platform: false, autofill: false };
  }
  const [platform, autofill] = await Promise.all([
    PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().catch(() => false),
    PublicKeyCredential.isConditionalMediationAvailable?.().catch(() => false) ?? false,
  ]);
  return { platform, autofill };
}

/** Per-device memory: a passkey was set up here, or the offer was dismissed. */
export type PasskeyDeviceState = "registered" | "dismissed";
const STORAGE_KEY = "mw.passkey";

export function readPasskeyState(): PasskeyDeviceState | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "registered" || value === "dismissed" ? value : null;
  } catch {
    return null;
  }
}

export function writePasskeyState(state: PasskeyDeviceState | null) {
  try {
    if (state) window.localStorage.setItem(STORAGE_KEY, state);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked (private mode): the offer may simply show again.
  }
}
