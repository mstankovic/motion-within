import { getLocale, getTranslations } from "next-intl/server";
import { formatIsoDate, isoWeekday, type IsoDate } from "@/lib/dates";
import { whenLabel, type DayPart, type TodayState } from "./derive";
import { plannedTime } from "./format";

/** Date, greeting and one line answering "what should I do today?" in words. */
export async function HomeHeader({
  today,
  part,
  name,
  state,
  longBreak,
}: {
  today: IsoDate;
  part: DayPart;
  name: string | null;
  state: TodayState;
  /** Over two weeks since the last workout: the header carries that note instead. */
  longBreak: boolean;
}) {
  const [t, locale] = await Promise.all([getTranslations("today"), getLocale()]);
  // "Tuesday, 29 September" / "utorak, 29. septembar"
  const date = `${formatIsoDate(today, locale, { weekday: "long" })}, ${formatIsoDate(today, locale, { day: "numeric", month: "long" })}`;
  const greeting = t("greeting", { part });

  return (
    <header className="flex flex-col gap-1">
      <p className="text-ink-muted text-[0.8125rem] leading-[1.125rem] font-bold tracking-[0.06em] uppercase">
        {date}
      </p>
      <h1 className="text-[1.875rem] leading-9 font-extrabold tracking-[-0.02em]">
        {name ? `${greeting}, ${name}` : greeting}
      </h1>
      <p className="text-ink-muted mt-0.5 text-[0.9375rem] leading-[1.375rem] text-pretty">
        {longBreak ? t("context.longBreak") : contextLine(t, state, today, locale)}
      </p>
    </header>
  );
}

type T = Awaited<ReturnType<typeof getTranslations<"today">>>;

function contextLine(t: T, state: TodayState, today: IsoDate, locale: string) {
  switch (state.kind) {
    case "planned":
      return t("context.planned", {
        count: state.plannedToday,
        time: plannedTime(state.workout.planned_time) ?? "none",
      });
    case "completed":
      return t("context.completed", { left: state.leftThisWeek });
    case "rest": {
      const next = state.next;
      return t("context.rest", {
        when: next ? whenLabel(next.planned_date, today) : "none",
        wd: next ? String(isoWeekday(next.planned_date)) : "7",
        date: next
          ? formatIsoDate(next.planned_date, locale, { day: "numeric", month: "long" })
          : "",
      });
    }
    case "missed":
      return t("context.missed", { wd: String(isoWeekday(state.workout.planned_date)) });
    default:
      return t(`context.${state.kind}`);
  }
}
