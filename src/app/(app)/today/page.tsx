import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PasskeyOffer } from "@/features/auth/passkey-ui";
import {
  getLastCompletedAt,
  getOpenSession,
  getWorkoutsInRange,
} from "@/features/calendar/queries";
import { getActiveProgramDays } from "@/features/programs/queries";
import { isLongBreak } from "@/features/progression/engine";
import {
  dayPart,
  deriveTodayState,
  hourInTimeZone,
  lastWeekInsight,
  summarizeWeek,
  upNextList,
} from "@/features/today/derive";
import { HomeHeader } from "@/features/today/home-header";
import { getSessionProgress } from "@/features/today/queries";
import { TodayCard } from "@/features/today/today-card";
import { UpcomingList } from "@/features/today/upcoming-list";
import { WeekSummary } from "@/features/today/week-summary";
import { addDays, isIsoDate, startOfWeek, todayInTimeZone } from "@/lib/dates";
import { getProfile } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("today"))("title") };
}

/** How far ahead rest days and Up next look for the next planned workout. */
const LOOKAHEAD_DAYS = 28;

export default async function TodayPage({ searchParams }: PageProps<"/today">) {
  const [profile, params] = await Promise.all([getProfile(), searchParams]);
  const today = todayInTimeZone(profile.timezone);
  const weekStart = startOfWeek(today);
  const shownStart =
    typeof params.week === "string" && isIsoDate(params.week)
      ? startOfWeek(params.week)
      : weekStart;
  const isCurrentWeek = shownStart === weekStart;

  // This week through the look-ahead in one query; the previous week for the insight.
  const [workouts, previousWeek, otherWeek, program, openSession, lastCompletedAt] =
    await Promise.all([
      getWorkoutsInRange(weekStart, addDays(today, LOOKAHEAD_DAYS)),
      getWorkoutsInRange(addDays(weekStart, -7), addDays(weekStart, -1)),
      isCurrentWeek ? null : getWorkoutsInRange(shownStart, addDays(shownStart, 6)),
      getActiveProgramDays(),
      getOpenSession(),
      getLastCompletedAt(),
    ]);

  const state = deriveTodayState(workouts, today, openSession, program);
  const progressSession =
    state.kind === "in_progress"
      ? state.session.id
      : state.kind === "completed"
        ? state.workout.sessionId
        : null;
  const progress = progressSession ? await getSessionProgress(progressSession) : null;

  const shownWeek = otherWeek ?? workouts.filter((w) => w.planned_date <= addDays(weekStart, 6));
  const longBreak =
    isLongBreak(lastCompletedAt) && ["planned", "rest", "missed"].includes(state.kind);
  const hasProgramOrPlan = state.kind !== "no_program";

  return (
    <div className="flex flex-col gap-5.5">
      <div className="enter">
        <HomeHeader
          today={today}
          part={dayPart(hourInTimeZone(profile.timezone))}
          name={profile.display_name?.trim() || null}
          state={state}
          longBreak={longBreak}
        />
      </div>

      <div className="enter" style={{ "--i": 1 } as React.CSSProperties}>
        {/* Cross-fades when the state changes (e.g. Start → Continue → Summary). */}
        <div key={state.kind} className="animate-fade-in">
          <TodayCard
            state={state}
            today={today}
            weekStart={weekStart}
            timeZone={profile.timezone}
            progress={progress}
            program={program}
          />
        </div>
      </div>

      {hasProgramOrPlan ? (
        <>
          <div className="enter" style={{ "--i": 2 } as React.CSSProperties}>
            <WeekSummary
              summary={summarizeWeek(shownWeek, shownStart, today)}
              workouts={shownWeek}
              weekStart={shownStart}
              today={today}
              isCurrentWeek={isCurrentWeek}
              insight={lastWeekInsight(previousWeek)}
            />
          </div>
          <div className="enter" style={{ "--i": 3 } as React.CSSProperties}>
            <UpcomingList workouts={upNextList(workouts, today, state)} today={today} />
          </div>
        </>
      ) : null}

      <PasskeyOffer />
    </div>
  );
}
