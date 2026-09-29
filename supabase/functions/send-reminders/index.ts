// Supabase Edge Function: sends Web Push reminders for planned workouts.
// Invoked by Supabase Cron every few minutes (see README). Requires secrets:
//   CRON_SECRET, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by the platform.
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";
import { shouldSend, type ReminderPrefs } from "../_shared/reminders.ts";

const MESSAGES = {
  sr: { title: "Vreme je za trening", body: (t: string) => `${t} — spremno kad i ti.` },
  en: { title: "Time to train", body: (t: string) => `${t} — ready when you are.` },
} as const;

Deno.serve(async (req) => {
  const secret = Deno.env.get("CRON_SECRET");
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("unauthorized", { status: 401 });
  }

  webpush.setVapidDetails(
    Deno.env.get("VAPID_SUBJECT") ?? "mailto:hello@motionwithin.me",
    Deno.env.get("VAPID_PUBLIC_KEY")!,
    Deno.env.get("VAPID_PRIVATE_KEY")!,
  );
  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    {
      auth: { persistSession: false },
    },
  );

  const now = new Date();
  const from = new Date(now.getTime() - 2 * 86_400_000).toISOString().slice(0, 10);
  const to = new Date(now.getTime() + 2 * 86_400_000).toISOString().slice(0, 10);

  const { data: prefs, error } = await db
    .from("notification_preferences")
    .select(
      "owner_id, default_reminder_minutes_before, default_workout_time, quiet_hours_start, quiet_hours_end",
    )
    .eq("workout_reminders_enabled", true);
  if (error) return new Response("error", { status: 500 });

  const ids = (prefs ?? []).map((p) => p.owner_id);
  const { data: profiles } = ids.length
    ? await db.from("profiles").select("id, timezone, locale").in("id", ids)
    : { data: [] };
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  let sent = 0;
  for (const p of prefs ?? []) {
    const profile = profileById.get(p.owner_id) ?? { timezone: "Europe/Podgorica", locale: "sr" };
    const rp: ReminderPrefs = {
      timeZone: profile.timezone,
      minutesBefore: p.default_reminder_minutes_before,
      defaultWorkoutTime: p.default_workout_time,
      quietStart: p.quiet_hours_start,
      quietEnd: p.quiet_hours_end,
    };

    const [{ data: workouts }, { data: subs }] = await Promise.all([
      db
        .from("scheduled_workouts")
        .select("id, title, planned_date, planned_time, reminder_at")
        .eq("owner_id", p.owner_id)
        .eq("status", "planned")
        .gte("planned_date", from)
        .lte("planned_date", to),
      db
        .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth")
        .eq("owner_id", p.owner_id)
        .is("revoked_at", null),
    ]);
    if (!workouts?.length || !subs?.length) continue;

    for (const w of workouts) {
      const { send, due } = shouldSend(
        {
          scheduledWorkoutId: w.id,
          plannedDate: w.planned_date,
          plannedTime: w.planned_time,
          reminderAt: w.reminder_at,
        },
        rp,
        now,
      );
      if (!send) continue;

      // Claim the delivery first: the unique key makes this idempotent across overlapping runs.
      const { data: claim, error: claimError } = await db
        .from("reminder_deliveries")
        .insert({
          owner_id: p.owner_id,
          scheduled_workout_id: w.id,
          reminder_at: due.toISOString(),
        })
        .select("id")
        .maybeSingle();
      if (claimError || !claim) continue;

      const msg = MESSAGES[profile.locale === "en" ? "en" : "sr"];
      const payload = JSON.stringify({
        title: msg.title,
        body: msg.body(w.title),
        url: `/workouts/${w.id}/start`,
        tag: `workout-${w.id}`,
      });

      let ok = 0;
      for (const s of subs) {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
            { TTL: 3600 },
          );
          ok++;
          await db
            .from("push_subscriptions")
            .update({ last_used_at: now.toISOString() })
            .eq("id", s.id);
        } catch (e) {
          const status = (e as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            await db
              .from("push_subscriptions")
              .update({ revoked_at: now.toISOString() })
              .eq("id", s.id);
          }
        }
      }
      await db.from("reminder_deliveries").update({ success_count: ok }).eq("id", claim.id);
      sent += ok;
    }
  }

  return Response.json({ sent });
});
