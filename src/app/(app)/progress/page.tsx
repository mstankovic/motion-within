import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ChevronRight, Ruler, Trophy } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { formatRecord } from "@/features/progress/format-record";
import { getProgressOverviewData } from "@/features/progress/queries";
import { computeRecords } from "@/features/progress/records";
import {
  adherence,
  average,
  countCompletedInRange,
  localDate,
  weekRange,
  weeklyContinuity,
} from "@/features/progress/stats";
import { getPendingSuggestions } from "@/features/progression/queries";
import { SuggestionCard } from "@/features/progression/suggestion-card";
import { getCompletedSets } from "@/features/workout-session/queries";
import type { TrackingMode } from "@/features/workout-session/types";
import { formatIsoDate, formatNumber, todayInTimeZone } from "@/lib/dates";
import { getProfile } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("progress"))("title") };
}

const WEEKS = 8;

export default async function ProgressPage() {
  const [t, tc, locale, profile] = await Promise.all([
    getTranslations("progress"),
    getTranslations("common"),
    getLocale(),
    getProfile(),
  ]);
  const tz = profile.timezone;
  const today = todayInTimeZone(tz);
  const [data, suggestions] = await Promise.all([
    getProgressOverviewData(today, WEEKS),
    getPendingSuggestions(locale),
  ]);

  const thisWeek = countCompletedInRange(data.sessions, weekRange(today), tz);
  const lastWeek = countCompletedInRange(data.sessions, weekRange(today, -1), tz);
  const adh = adherence(data.scheduled, today);
  const continuity = weeklyContinuity(data.sessions, today, tz, WEEKS);
  const activeWeeks = continuity.filter((w) => w.count > 0).length;
  const maxCount = Math.max(1, ...continuity.map((w) => w.count));
  const completed = data.sessions.filter((s) => s.status === "completed");
  const avgRpe = average(completed.map((s) => s.session_rpe));
  const avgEnergy = average(completed.map((s) => s.energy_after));

  // Recent personal records across exercises.
  const sets = await getCompletedSets(data.exercises.map((e) => e.id));
  const records = data.exercises
    .flatMap((e) =>
      computeRecords(
        e.mode as TrackingMode,
        sets.filter((s) => s.exercise_id === e.id),
      ).map((r) => ({ name: e.name, id: e.id, r })),
    )
    .sort((a, b) => b.r.performedAt.localeCompare(a.r.performedAt))
    .slice(0, 5);

  const firstWeight = data.weights[0];
  const lastWeight = data.weights.at(-1);
  const weightChange =
    firstWeight && lastWeight && firstWeight !== lastWeight
      ? Number(lastWeight.weight_kg) - Number(firstWeight.weight_kg)
      : null;

  return (
    <>
      <PageHeader title={t("title")} />

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Card>
          <p className="text-ink-muted text-sm font-semibold">{t("thisWeek")}</p>
          <p className="text-2xl font-extrabold">{t("workoutsCount", { count: thisWeek })}</p>
        </Card>
        <Card>
          <p className="text-ink-muted text-sm font-semibold">{t("lastWeek")}</p>
          <p className="text-2xl font-extrabold">{t("workoutsCount", { count: lastWeek })}</p>
        </Card>
      </div>

      <Card className="mb-4 space-y-4">
        <div>
          <p className="text-ink-muted text-sm font-semibold">{t("adherence")}</p>
          <p className="text-xl font-extrabold">
            {adh.percent != null
              ? `${t("adherenceValue", { percent: adh.percent })} · ${adh.completed}/${adh.total}`
              : t("adherenceNone")}
          </p>
        </div>
        <div>
          <p className="text-ink-muted text-sm font-semibold">{t("continuity")}</p>
          <p className="mb-2 font-bold">
            {t("continuityValue", { active: activeWeeks, weeks: WEEKS })}
          </p>
          <ol className="flex h-16 items-end gap-1.5" aria-hidden="true">
            {continuity.map((w) => (
              <li key={w.weekStart} className="flex flex-1 flex-col items-center justify-end gap-1">
                <div
                  className={
                    w.count ? "bg-brand w-full rounded-md" : "bg-surface-muted w-full rounded-md"
                  }
                  style={{ height: `${w.count ? Math.max(18, (w.count / maxCount) * 100) : 12}%` }}
                />
              </li>
            ))}
          </ol>
          <div className="text-ink-subtle mt-1 flex justify-between text-xs" aria-hidden="true">
            <span>
              {formatIsoDate(continuity[0].weekStart, locale, { day: "numeric", month: "short" })}
            </span>
            <span>
              {formatIsoDate(continuity.at(-1)!.weekStart, locale, {
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>
        </div>
        {avgRpe != null || avgEnergy != null ? (
          <dl className="grid grid-cols-2 gap-3">
            <div>
              <dt className="text-ink-muted text-sm font-semibold">{t("avgRpe")}</dt>
              <dd className="text-lg font-extrabold">
                {avgRpe != null ? `${formatNumber(avgRpe, locale)}/10` : "–"}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted text-sm font-semibold">{t("avgEnergy")}</dt>
              <dd className="text-lg font-extrabold">
                {avgEnergy != null ? `${formatNumber(avgEnergy, locale)}/5` : "–"}
              </dd>
            </div>
          </dl>
        ) : null}
      </Card>

      <section className="mb-4" aria-labelledby="records">
        <h2 id="records" className="text-ink-muted mb-2 text-sm font-bold tracking-wide uppercase">
          {t("recentRecords")}
        </h2>
        {records.length ? (
          <Card className="p-0">
            <ul className="divide-border divide-y">
              {records.map(({ name, id, r }, i) => (
                <li key={i}>
                  <Link
                    href={`/progress/exercises/${id}`}
                    className="active:bg-surface-muted flex min-h-14 items-center gap-3 px-4 py-2 transition-colors duration-(--dur-fast)"
                  >
                    <Trophy aria-hidden="true" className="text-accent size-5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{name}</p>
                      <p className="text-ink-muted text-sm">
                        {formatRecord(r, t, locale)} ·{" "}
                        {formatIsoDate(localDate(r.performedAt, profile.timezone), locale, {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <EmptyState title={t("noRecords")} />
        )}
      </section>

      <Link
        href="/progress/body"
        className="bg-surface active:bg-surface-muted mb-4 flex min-h-16 items-center gap-3 rounded-[var(--radius-card)] px-4 py-3 shadow-[var(--shadow-card)] transition-colors duration-(--dur-fast)"
      >
        <Ruler aria-hidden="true" className="text-brand size-5" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{t("weightChange")}</p>
          <p className="text-ink-muted text-sm">
            {weightChange != null
              ? t("weightChangeValue", {
                  change: `${weightChange > 0 ? "+" : ""}${formatNumber(weightChange, locale)}`,
                  date: formatIsoDate(firstWeight!.measured_on, locale, {
                    day: "numeric",
                    month: "short",
                  }),
                })
              : lastWeight
                ? `${formatNumber(Number(lastWeight.weight_kg), locale)} ${tc("kg")}`
                : t("noWeight")}
          </p>
        </div>
        <ChevronRight aria-hidden="true" className="text-ink-subtle size-5" />
      </Link>

      <section className="mb-4 space-y-2" aria-labelledby="suggestions">
        <h2 id="suggestions" className="text-ink-muted text-sm font-bold tracking-wide uppercase">
          {t("suggestions")}
        </h2>
        {suggestions.length ? (
          suggestions.map((s) => <SuggestionCard key={s.id} suggestion={s} />)
        ) : (
          <p className="text-ink-muted text-sm">{t("noSuggestions")}</p>
        )}
      </section>

      <section aria-labelledby="exercises">
        <h2
          id="exercises"
          className="text-ink-muted mb-2 text-sm font-bold tracking-wide uppercase"
        >
          {t("exercises")}
        </h2>
        {data.exercises.length ? (
          <ul className="divide-border bg-surface divide-y overflow-hidden rounded-[var(--radius-card)] shadow-[var(--shadow-card)]">
            {data.exercises.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/progress/exercises/${e.id}`}
                  className="active:bg-surface-muted flex min-h-14 items-center gap-3 px-4 py-2 transition-colors duration-(--dur-fast)"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{e.name}</p>
                    <p className="text-ink-muted text-sm">
                      {formatIsoDate(localDate(e.last, profile.timezone), locale, {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      · {e.count}×
                    </p>
                  </div>
                  <ChevronRight aria-hidden="true" className="text-ink-subtle size-5" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title={t("noExercises")} />
        )}
      </section>
    </>
  );
}
