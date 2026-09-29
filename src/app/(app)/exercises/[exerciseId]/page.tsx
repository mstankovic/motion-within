import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ChartLine } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { ExerciseActionsBar } from "@/features/exercises/exercise-actions-bar";
import { exerciseDescription, exerciseName, refName } from "@/features/exercises/model";
import { getExercise, getReferenceData } from "@/features/exercises/queries";
import { PerformanceList } from "@/features/progress/performance-list";
import type { Performance } from "@/features/workout-session/types";
import { createClient, getProfile } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: PageProps<"/exercises/[exerciseId]">): Promise<Metadata> {
  const { exerciseId } = await params;
  const ex = await getExercise(exerciseId).catch(() => null);
  return { title: ex ? exerciseName(ex, await getLocale()) : undefined };
}

export default async function ExercisePage({ params }: PageProps<"/exercises/[exerciseId]">) {
  const { exerciseId } = await params;
  const [t, locale, ex, refs, profile] = await Promise.all([
    getTranslations("exercises"),
    getLocale(),
    getExercise(exerciseId),
    getReferenceData(),
    getProfile(),
  ]);
  if (!ex) notFound();

  const supabase = await createClient();
  const { data: history } = await supabase.rpc("exercise_performances", {
    p_exercise_id: exerciseId,
    p_limit: 5,
  });
  const performances = (history ?? []) as unknown as Performance[];

  const muscleById = new Map(refs.muscles.map((m) => [m.id, m]));
  const equipmentById = new Map(refs.equipment.map((e) => [e.id, e]));
  const primary = ex.exercise_muscles.filter((m) => m.role === "primary");
  const secondary = ex.exercise_muscles.filter((m) => m.role === "secondary");
  const description = exerciseDescription(ex, locale);

  return (
    <>
      <PageHeader title={exerciseName(ex, locale)} backHref="/exercises" backLabel={t("title")} />
      <div className="mb-4 flex flex-wrap gap-1.5">
        <Badge>{t(`trackingMode.${ex.tracking_mode}`)}</Badge>
        {ex.is_mobility ? <Badge tone="info">{t("mobility")}</Badge> : null}
        {ex.source === "user" ? (
          <Badge tone="brand">{t("mine")}</Badge>
        ) : (
          <Badge>{t("system")}</Badge>
        )}
        {!ex.is_active ? <Badge tone="warning">{t("archived")}</Badge> : null}
      </div>

      <Card className="mb-4 space-y-4">
        {description ? (
          <section>
            <CardTitle className="mb-1 text-base">{t("description")}</CardTitle>
            <p className="text-ink-muted text-[0.95rem] leading-relaxed">{description}</p>
          </section>
        ) : null}
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          {[
            [t("primary"), primary.map((m) => muscleById.get(m.muscle_group_id))],
            [t("secondary"), secondary.map((m) => muscleById.get(m.muscle_group_id))],
            [t("equipment"), ex.exercise_equipment.map((e) => equipmentById.get(e.equipment_id))],
          ].map(([label, items]) => (
            <div key={label as string}>
              <dt className="font-semibold">{label as string}</dt>
              <dd className="text-ink-muted">
                {(items as ({ name_sr: string; name_en: string } | undefined)[])
                  .filter(Boolean)
                  .map((i) => refName(i!, locale))
                  .join(", ") || "–"}
              </dd>
            </div>
          ))}
        </dl>
        <ExerciseActionsBar id={ex.id} isOwn={ex.source === "user" && ex.owner_id === profile.id} />
      </Card>

      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-bold">{t("history")}</h2>
        {performances.length ? (
          <Link
            href={`/progress/exercises/${ex.id}`}
            className="text-brand flex min-h-11 items-center gap-1 text-sm font-semibold"
          >
            <ChartLine aria-hidden="true" className="size-4" />
            {(await getTranslations("progress"))("chart")}
          </Link>
        ) : null}
      </div>
      {performances.length ? (
        <PerformanceList
          performances={performances}
          mode={ex.tracking_mode}
          timeZone={profile.timezone}
        />
      ) : (
        <EmptyState title={t("noHistory")} />
      )}
    </>
  );
}
