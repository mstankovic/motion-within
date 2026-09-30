import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { PlanWeekButton } from "@/features/calendar/plan-week-button";
import { getWorkoutsInRange } from "@/features/calendar/queries";
import { ScheduleWeek } from "@/features/calendar/schedule-week";
import { getActiveProgramDays } from "@/features/programs/queries";
import { shortDate } from "@/features/today/format";
import { cn } from "@/lib/cn";
import { addDays, formatIsoDate, isIsoDate, startOfWeek, todayInTimeZone } from "@/lib/dates";
import { getProfile } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("calendar"))("schedule") };
}

/** The full schedule, week by week. Today's guidance lives on /today. */
export default async function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  const [t, tn, locale, profile, params] = await Promise.all([
    getTranslations("calendar"),
    getTranslations("nav"),
    getLocale(),
    getProfile(),
    searchParams,
  ]);
  const today = todayInTimeZone(profile.timezone);
  const requested = typeof params.week === "string" && isIsoDate(params.week) ? params.week : today;
  const weekStart = startOfWeek(requested);
  const weekEnd = addDays(weekStart, 6);
  const isCurrentWeek = weekStart === startOfWeek(today);

  const [workouts, activeProgram] = await Promise.all([
    getWorkoutsInRange(weekStart, weekEnd),
    getActiveProgramDays(),
  ]);
  // An empty week that is not over yet can be filled from the program's weekdays.
  const canPlan =
    workouts.length === 0 &&
    weekEnd >= today &&
    Boolean(activeProgram?.program_days.some((d) => d.preferred_weekday != null));

  const arrow =
    "hover:bg-surface-muted active:bg-surface-muted flex size-11 shrink-0 items-center justify-center rounded-full transition-colors duration-(--dur-fast)";

  return (
    <>
      <PageHeader title={t("schedule")} backHref="/today" backLabel={tn("today")} />

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-1 px-1">
          <div className="min-w-0 flex-1">
            <h2 className="text-[1.0625rem] leading-6 font-extrabold">
              {isCurrentWeek
                ? t("title")
                : t("weekOf", {
                    date: formatIsoDate(weekStart, locale, { day: "numeric", month: "long" }),
                  })}
            </h2>
            <p className="text-ink-muted text-[0.8125rem] leading-[1.125rem]">
              {shortDate(weekStart, locale)} – {shortDate(weekEnd, locale)}
            </p>
          </div>
          {!isCurrentWeek ? (
            <Link
              href="/calendar"
              className="border-border bg-surface pressable inline-flex h-9 items-center rounded-full border px-3 text-[0.8125rem] font-bold"
            >
              {t("thisWeek")}
            </Link>
          ) : null}
          <Link
            href={`/calendar?week=${addDays(weekStart, -7)}`}
            aria-label={t("previousWeek")}
            className={arrow}
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </Link>
          <Link
            href={`/calendar?week=${addDays(weekStart, 7)}`}
            aria-label={t("nextWeek")}
            className={cn(arrow, "-mr-2")}
          >
            <ChevronRight aria-hidden="true" className="size-5" />
          </Link>
        </div>

        {canPlan ? <PlanWeekButton weekStart={weekStart} /> : null}

        <ScheduleWeek weekStart={weekStart} today={today} workouts={workouts} />
      </div>
    </>
  );
}
