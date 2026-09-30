"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, requireUserId } from "@/lib/supabase/server";
import { setLocaleCookie } from "@/lib/i18n/set-locale-cookie";
import { isLocale } from "@/lib/i18n/config";
import {
  onboardingSchema,
  profileSchema,
  type OnboardingInput,
  type ProfileInput,
} from "@/lib/validation/profile";
import { startOfWeek, todayInTimeZone } from "@/lib/dates";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Switches UI language immediately (cookie) and persists it when signed in. */
export async function setLanguage(locale: string) {
  if (!isLocale(locale)) return;
  await setLocaleCookie(locale);
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (userId) await supabase.from("profiles").update({ locale }).eq("id", userId);
  revalidatePath("/", "layout");
}

export async function completeOnboarding(input: OnboardingInput): Promise<ActionResult> {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation" };
  const data = parsed.data;

  const userId = await requireUserId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: data.displayName || null,
      locale: data.locale,
      timezone: data.timezone,
      goals: data.goals,
      preferred_weekdays: [...new Set(data.preferredWeekdays)].sort(),
      safety_notice_acknowledged_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) return { ok: false, error: "generic" };

  await setLocaleCookie(data.locale);

  if (data.createStarter) {
    const { count } = await supabase
      .from("programs")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId);
    if (!count) {
      const { error: starterError } = await supabase.rpc("create_starter_program", {
        p_weekdays: data.preferredWeekdays,
        p_activate: true,
      });
      if (starterError) return { ok: false, error: "generic" };
      await supabase.rpc("plan_week", {
        p_week_start: startOfWeek(todayInTimeZone(data.timezone)),
      });
    }
  }

  // Mark complete last so a failure above lets the user retry onboarding.
  await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", userId);
  redirect("/today");
}

export async function updateProfile(input: ProfileInput): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation" };
  const userId = await requireUserId();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName || null,
      locale: parsed.data.locale,
      timezone: parsed.data.timezone,
      goals: parsed.data.goals,
      preferred_weekdays: [...new Set(parsed.data.preferredWeekdays)].sort(),
    })
    .eq("id", userId);
  if (error) return { ok: false, error: "generic" };
  await setLocaleCookie(parsed.data.locale);
  revalidatePath("/", "layout");
  return { ok: true };
}
