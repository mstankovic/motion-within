import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/app/page-header";
import { NotificationSettings } from "@/features/notifications/notification-settings";
import { createClient, requireUserId } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("notifications"))("title") };
}

export default async function NotificationSettingsPage() {
  const userId = await requireUserId();
  const [t, tp] = await Promise.all([getTranslations("notifications"), getTranslations("profile")]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("owner_id", userId)
    .maybeSingle();

  return (
    <>
      <PageHeader title={t("title")} backHref="/profile" backLabel={tp("title")} />
      <NotificationSettings
        vapidKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null}
        initial={{
          enabled: data?.workout_reminders_enabled ?? false,
          minutesBefore: data?.default_reminder_minutes_before ?? 60,
          defaultTime: data?.default_workout_time ?? "18:00",
          quietStart: data?.quiet_hours_start ?? "",
          quietEnd: data?.quiet_hours_end ?? "",
        }}
      />
    </>
  );
}
