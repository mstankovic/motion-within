"use server";

import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { setLocaleCookie } from "@/lib/i18n/set-locale-cookie";
import { emailSchema, verifyOtpSchema } from "@/lib/validation/auth";

export type AuthErrorCode =
  "invalidEmail" | "codeInvalid" | "rateLimited" | "linkInvalid" | "generic";

export type AuthState = {
  error?: AuthErrorCode;
  /** Address the code was sent to (normalized). */
  sentTo?: string;
};

function mapAuthError(code: string | undefined, status?: number): AuthErrorCode {
  switch (code) {
    case "otp_expired":
    case "otp_disabled":
      return "codeInvalid";
    case "email_address_invalid":
    case "validation_failed":
      return "invalidEmail";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "rateLimited";
    default:
      return status === 429 ? "rateLimited" : "generic";
  }
}

function safeNext(next: FormDataEntryValue | null) {
  const value = typeof next === "string" ? next : "";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/today";
}

/** Emails a one-time sign-in code. Creates the account on first use (no separate sign-up). */
export async function requestOtp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = emailSchema.safeParse(
    String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
  );
  if (!parsed.success) return { error: "invalidEmail" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: {
      shouldCreateUser: true,
      // Only applied to new users: prefills the profile and picks the email language.
      data: { locale: await getLocale() },
    },
  });
  if (error) return { error: mapAuthError(error.code, error.status) };
  return { sentTo: parsed.data };
}

export async function verifyOtp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = verifyOtpSchema.safeParse({
    email: formData.get("email"),
    token: formData.get("token"),
  });
  if (!parsed.success) return { error: "codeInvalid" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ ...parsed.data, type: "email" });
  if (error || !data.user) return { error: mapAuthError(error?.code, error?.status) };

  return finishSignIn(data.user.id, formData.get("next"));
}

/** Called after the browser signed in with a passkey (the session cookie is already set). */
export async function completePasskeySignIn(next: string | null): Promise<AuthState> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return { error: "generic" };
  return finishSignIn(userId, next);
}

async function finishSignIn(userId: string, next: FormDataEntryValue | null): Promise<never> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("locale")
    .eq("id", userId)
    .single();
  await setLocaleCookie(profile?.locale);

  // New users are sent on to onboarding by the app layout.
  return redirect(safeNext(next));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
