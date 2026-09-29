"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient, requireUserId } from "@/lib/supabase/server";
import { timeSchema } from "@/lib/validation/calendar";

const prefsSchema = z.object({
  enabled: z.boolean(),
  minutesBefore: z.number().int().min(0).max(1440),
  defaultTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  quietStart: timeSchema,
  quietEnd: timeSchema,
});

export async function savePreferences(input: z.input<typeof prefsSchema>) {
  const parsed = prefsSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "validation" };
  const userId = await requireUserId();
  const supabase = await createClient();
  const { error } = await supabase
    .from("notification_preferences")
    .update({
      workout_reminders_enabled: parsed.data.enabled,
      default_reminder_minutes_before: parsed.data.minutesBefore,
      default_workout_time: parsed.data.defaultTime,
      quiet_hours_start: parsed.data.quietStart,
      quiet_hours_end: parsed.data.quietEnd,
    })
    .eq("owner_id", userId);
  if (error) return { ok: false as const, error: "generic" };
  revalidatePath("/settings/notifications");
  return { ok: true as const };
}

const subscriptionSchema = z.object({
  endpoint: z.url().max(2000),
  keys: z.object({ p256dh: z.string().min(1).max(500), auth: z.string().min(1).max(500) }),
});

export async function saveSubscription(sub: unknown, userAgent: string) {
  const parsed = subscriptionSchema.safeParse(sub);
  if (!parsed.success) return { ok: false as const, error: "validation" };
  const userId = await requireUserId();
  const supabase = await createClient();
  // Re-subscribing the same endpoint re-activates it for the current user.
  await supabase.from("push_subscriptions").delete().eq("endpoint", parsed.data.endpoint);
  const { error } = await supabase.from("push_subscriptions").insert({
    owner_id: userId,
    endpoint: parsed.data.endpoint,
    p256dh: parsed.data.keys.p256dh,
    auth: parsed.data.keys.auth,
    user_agent: userAgent.slice(0, 300),
  });
  if (error) return { ok: false as const, error: "generic" };
  return { ok: true as const };
}

export async function removeSubscription(endpoint: string) {
  await requireUserId();
  const supabase = await createClient();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  return { ok: true as const };
}
