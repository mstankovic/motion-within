import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/ui/states";
import { AddWorkoutForm } from "@/features/calendar/add-workout-form";
import { DayWorkoutItem } from "@/features/calendar/day-workout-item";
import { getWorkoutsInRange } from "@/features/calendar/queries";
import { StatusBadge } from "@/features/calendar/status";
import { WorkoutCta } from "@/features/calendar/workout-cta";
import { getActiveProgramDays } from "@/features/programs/queries";
import { formatIsoDate, isIsoDate, startOfWeek } from "@/lib/dates";

export async function generateMetadata({
  params,
}: PageProps<"/calendar/[date]">): Promise<Metadata> {
  const { date } = await params;
  return { title: isIsoDate(date) ? formatIsoDate(date, await getLocale()) : undefined };
}

export default async function CalendarDayPage({ params }: PageProps<"/calendar/[date]">) {
  const { date } = await params;
  if (!isIsoDate(date)) notFound();
  const [t, locale, workouts, active] = await Promise.all([
    getTranslations("calendar"),
    getLocale(),
    getWorkoutsInRange(date, date),
    getActiveProgramDays(),
  ]);
  const label = formatIsoDate(date, locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <PageHeader
        title={label}
        backHref={`/calendar?week=${startOfWeek(date)}`}
        backLabel={t("title")}
      />
      <div className="space-y-4">
        {workouts.length === 0 ? <EmptyState title={t("day.empty")} /> : null}
        {workouts.map((w) => (
          <DayWorkoutItem
            key={w.id}
            workout={w}
            statusBadge={<StatusBadge status={w.status} />}
            cta={<WorkoutCta workout={w} size="md" />}
          />
        ))}
        {active ? (
          <AddWorkoutForm
            date={date}
            title={t("day.addTitle", {
              date: formatIsoDate(date, locale, { day: "numeric", month: "long" }),
            })}
            days={active.program_days.map((d) => ({ id: d.id, title: d.title }))}
          />
        ) : (
          <p className="text-ink-muted text-sm">{t("noActiveProgram")}</p>
        )}
      </div>
    </>
  );
}
