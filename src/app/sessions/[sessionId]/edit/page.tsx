import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { WorkoutRunner } from "@/features/workout-session/runner/workout-runner";
import { loadRunnerContext } from "@/features/workout-session/load-runner-data";
import { getSession } from "@/features/workout-session/queries";
import { localDate } from "@/features/progress/stats";
import { formatIsoDate } from "@/lib/dates";
import { getProfile } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("workout"))("editTitle") };
}

export default async function EditSessionPage({ params }: PageProps<"/sessions/[sessionId]/edit">) {
  const { sessionId } = await params;
  const [data, profile, locale] = await Promise.all([
    getSession(sessionId),
    getProfile(),
    getLocale(),
  ]);
  if (!data) notFound();
  if (data.session.status === "in_progress") redirect(`/sessions/${sessionId}`);

  const { last, bests } = await loadRunnerContext(data);
  return (
    <WorkoutRunner
      mode="edit"
      initial={data}
      lastPerformances={last}
      bests={bests}
      dateLabel={formatIsoDate(localDate(data.session.started_at, profile.timezone), locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
      })}
    />
  );
}
