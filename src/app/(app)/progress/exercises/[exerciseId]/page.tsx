import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState, Notice } from "@/components/ui/states";
import { exerciseName } from "@/features/exercises/model";
import { getExercise } from "@/features/exercises/queries";
import { formatRecord } from "@/features/progress/format-record";
import { LineChart } from "@/features/progress/line-chart";
import { PerformanceList } from "@/features/progress/performance-list";
import { chartMetric, chartSeries, computeRecords } from "@/features/progress/records";
import { localDate } from "@/features/progress/stats";
import { getCompletedSets } from "@/features/workout-session/queries";
import type { Performance } from "@/features/workout-session/types";
import { formatIsoDate, formatNumber } from "@/lib/dates";
import { createClient, getProfile } from "@/lib/supabase/server";

const PAGE = 20;

export async function generateMetadata({
  params,
}: PageProps<"/progress/exercises/[exerciseId]">): Promise<Metadata> {
  const ex = await getExercise((await params).exerciseId).catch(() => null);
  return { title: ex ? exerciseName(ex, await getLocale()) : undefined };
}

export default async function ExerciseProgressPage({
  params,
  searchParams,
}: PageProps<"/progress/exercises/[exerciseId]">) {
  const { exerciseId } = await params;
  const { before } = await searchParams;
  const [t, locale, profile, ex] = await Promise.all([
    getTranslations("progress"),
    getLocale(),
    getProfile(),
    getExercise(exerciseId),
  ]);
  if (!ex) notFound();

  const supabase = await createClient();
  const [sets, history] = await Promise.all([
    getCompletedSets([exerciseId]),
    supabase.rpc("exercise_performances", {
      p_exercise_id: exerciseId,
      p_limit: PAGE + 1,
      p_before: typeof before === "string" ? before : undefined,
    }),
  ]);
  const all = (history.data ?? []) as unknown as Performance[];
  const performances = all.slice(0, PAGE);
  const hasMore = all.length > PAGE;

  // History can mix tracking modes if the user changed it; use the exercise's current mode.
  const mode = ex.tracking_mode;
  const records = computeRecords(mode, sets);
  const series = chartSeries(mode, sets).map((p) => ({
    x: formatIsoDate(localDate(p.date, profile.timezone), locale, {
      day: "numeric",
      month: "numeric",
    }),
    y: p.value,
    label: p.label,
  }));
  const metric = chartMetric(mode);
  const unit = metric === "maxWeight" ? "kg" : metric === "maxDuration" ? "s" : undefined;
  const name = exerciseName(ex, locale);

  return (
    <>
      <div className="mb-4 flex items-start gap-2">
        <Link
          href="/progress"
          aria-label={t("title")}
          className="active:bg-surface-muted -ml-2 flex size-11 items-center justify-center rounded-full transition-colors duration-(--dur-fast)"
        >
          <span aria-hidden="true" className="text-2xl">
            ‹
          </span>
        </Link>
        <div className="min-w-0 flex-1 pt-1.5">
          <h1 className="text-2xl leading-tight font-extrabold tracking-tight">{name}</h1>
          <Link href={`/exercises/${ex.id}`} className="text-brand text-sm font-semibold">
            {(await getTranslations("exercises"))("description")}
          </Link>
        </div>
      </div>

      {mode === "reps_band" || mode === "reps_trx" ? (
        <Notice className="mb-4">{t("contextNote")}</Notice>
      ) : null}

      <Card className="mb-4">
        <CardTitle className="mb-2 text-base">{t("record")}</CardTitle>
        {records.length ? (
          <ul className="space-y-1">
            {records.map((r, i) => (
              <li key={i} className="font-bold">
                {formatRecord(r, t, locale)}{" "}
                <span className="text-ink-muted font-normal">
                  ·{" "}
                  {formatIsoDate(localDate(r.performedAt, profile.timezone), locale, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink-muted">{t("recordNone")}</p>
        )}
      </Card>

      {series.length >= 2 ? (
        <Card className="mb-4">
          <CardTitle className="mb-2 text-base">{t(`metric.${metric}`)}</CardTitle>
          <LineChart
            label={t(`metric.${metric}`)}
            points={series}
            unit={unit}
            summary={t("chartSummary", {
              first: `${formatNumber(series[0].y, locale, 2)}${unit ? ` ${unit}` : ""}`,
              last: `${formatNumber(series.at(-1)!.y, locale, 2)}${unit ? ` ${unit}` : ""}`,
              count: series.length,
            })}
          />
        </Card>
      ) : null}

      <h2 className="mb-2 text-lg font-bold">{t("history")}</h2>
      {performances.length ? (
        <>
          <PerformanceList performances={performances} mode={mode} timeZone={profile.timezone} />
          {hasMore ? (
            <Button asChild variant="outline" className="mt-3 w-full">
              <Link
                href={`/progress/exercises/${exerciseId}?before=${encodeURIComponent(performances.at(-1)!.performed_at)}`}
              >
                {t("loadMore")}
              </Link>
            </Button>
          ) : null}
        </>
      ) : (
        <EmptyState title={(await getTranslations("exercises"))("noHistory")} />
      )}
    </>
  );
}
