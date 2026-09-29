"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { setLocaleCookie } from "@/lib/i18n/set-locale-cookie";
import { emailSchema, passwordSchema, signInSchema, signUpSchema } from "@/lib/validation/auth";

export type AuthErrorCode =
  | "invalidCredentials"
  | "emailTaken"
  | "weakPassword"
  | "invalidEmail"
  | "rateLimited"
  | "linkInvalid"
  | "generic";

export type AuthState = {
  error?: AuthErrorCode;
  message?: "resetSent" | "checkEmail" | "passwordUpdated";
};

function mapAuthError(code: string | undefined, status?: number): AuthErrorCode {
  switch (code) {
    case "invalid_credentials":
      return "invalidCredentials";
    case "user_already_exists":
    case "email_exists":
      return "emailTaken";
    case "weak_password":
      return "weakPassword";
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

async function siteUrl() {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

function safeNext(next: FormDataEntryValue | null) {
  const value = typeof next === "string" ? next : "";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/calendar";
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "invalidCredentials" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: mapAuthError(error.code, error.status) };

  const { data: profile } = await supabase
    .from("profiles")
    .select("locale")
    .eq("id", data.user.id)
    .single();
  await setLocaleCookie(profile?.locale);

  redirect(safeNext(formData.get("next")));
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName") || undefined,
  });
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return { error: field === "password" ? "weakPassword" : "invalidEmail" };
  }

  const locale = await getLocale();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${await siteUrl()}/auth/callback?next=/onboarding`,
      // Only used by the database trigger to prefill the profile.
      data: { display_name: parsed.data.displayName ?? null, locale },
    },
  });
  if (error) return { error: mapAuthError(error.code, error.status) };

  // With email confirmation enabled there is no session yet.
  if (!data.session) return { message: "checkEmail" };

  await setLocaleCookie(locale);
  redirect("/onboarding");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "invalidEmail" };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${await siteUrl()}/auth/callback?next=/reset-password`,
  });
  // Do not reveal whether the account exists.
  if (error && (error.status === 429 || error.code?.startsWith("over_"))) {
    return { error: "rateLimited" };
  }
  return { message: "resetSent" };
}

export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = passwordSchema.safeParse(formData.get("password"));
  if (!parsed.success) return { error: "weakPassword" };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) {
    return {
      error:
        error.code === "same_password" ? "weakPassword" : mapAuthError(error.code, error.status),
    };
  }
  return { message: "passwordUpdated" };
}
