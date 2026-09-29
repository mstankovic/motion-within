import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Play } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/states";
import { ProgramView } from "@/features/programs/program-view";
import type { ProgramTree } from "@/features/programs/queries";
import { PROGRAM_TREE_SELECT } from "@/features/programs/queries";
import { startWorkout } from "@/features/workout-session/actions";
import { formatIsoDate } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("calendar"))("start") };
}

export default async function StartWorkoutPage({
  params,
}: PageProps<"/workouts/[scheduledWorkoutId]/start">) {
  const { scheduledWorkoutId } = await params;
  const [t, locale] = await Promise.all([getTranslations(), getLocale()]);
  const supabase = await createClient();

  const { data: workout } = await supabase
    .from("scheduled_workouts")
    .select(
      "id, title, planned_date, status, program_day_id, program_days(program_id), workout_sessions(id, status)",
    )
    .eq("id", scheduledWorkoutId)
    .maybeSingle();
  if (!workout) notFound();

  const existing = workout.workout_sessions.find((s) => s.status !== "abandoned");
  if (existing) redirect(`/sessions/${existing.id}`);

  let program: ProgramTree | null = null;
  if (workout.program_days) {
    const { data } = await supabase
      .from("programs")
      .select(PROGRAM_TREE_SELECT)
      .eq("id", workout.program_days.program_id)
      .eq("program_days.id", workout.program_day_id!)
      .order("sort_order", { referencedTable: "program_days.workout_blocks" })
      .order("sort_order", { referencedTable: "program_days.workout_blocks.block_exercises" })
      .maybeSingle();
    program = data as ProgramTree | null;
  }
  const day = program?.program_days[0];
  const exerciseCount = day?.workout_blocks.reduce((n, b) => n + b.block_exercises.length, 0) ?? 0;
  const start = startWorkout.bind(null, workout.id);

  return (
    <main className="pt-safe mx-auto w-full max-w-xl px-4 pt-4 pb-32">
      <PageHeader
        title={workout.title}
        subtitle={formatIsoDate(workout.planned_date, locale, {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
        backHref={`/calendar/${workout.planned_date}`}
        backLabel={t("calendar.title")}
      />
      {day ? (
        <div className="mb-4 flex gap-1.5">
          <Badge tone="brand">{t(`intensity.${day.intensity}`)}</Badge>
          <Badge>{t("calendar.exerciseCount", { count: exerciseCount })}</Badge>
        </div>
      ) : null}
      {program && exerciseCount > 0 ? (
        <ProgramView program={program} />
      ) : (
        <Notice tone="warning">{t("workout.notStartable")}</Notice>
      )}
      {exerciseCount > 0 && workout.status !== "completed" ? (
        <form
          action={async () => {
            "use server";
            await start();
          }}
          className="pb-safe border-border bg-surface/95 fixed inset-x-0 bottom-0 border-t px-4 pt-3 backdrop-blur"
        >
          <div className="mx-auto max-w-xl pb-2">
            <Button type="submit" size="lg">
              <Play aria-hidden="true" />
              {t("calendar.start")}
            </Button>
          </div>
        </form>
      ) : null}
    </main>
  );
}
