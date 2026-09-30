"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CalendarDays, Play, RotateCcw, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { FormMessage } from "@/components/app/form-message";
import { planWeek, rescheduleWorkout, setSkipped } from "@/features/calendar/actions";
import { createStarterProgram } from "@/features/programs/actions";
import { cn } from "@/lib/cn";
import { useOnline } from "@/lib/hooks/use-online";
import { useServerAction } from "@/lib/hooks/use-server-action";
import { primaryClass, secondaryClass } from "./styles";

/** Start (coral, needs a connection) or Continue (coral) on the hero. */
export function HeroAction({ href, kind }: { href: string; kind: "start" | "continue" }) {
  const t = useTranslations("calendar");
  const online = useOnline();
  const label = kind === "start" ? t("start") : t("continue");
  const icon =
    kind === "start" ? (
      <Play aria-hidden="true" className="fill-current" />
    ) : (
      <RotateCcw aria-hidden="true" strokeWidth={2.4} />
    );

  // Offline: the banner above the header says why.
  if (kind === "start" && !online) {
    return (
      <Button variant="accent" size="lg" className={primaryClass} disabled>
        {icon}
        {label}
      </Button>
    );
  }
  return (
    <Button asChild variant="accent" size="lg" className={primaryClass}>
      <Link href={href}>
        {icon}
        {label}
      </Link>
    </Button>
  );
}

/** Missed workout: move it to today (keeps its time) or mark it skipped. */
export function MissedActions({
  id,
  today,
  time,
}: {
  id: string;
  today: string;
  time: string | null;
}) {
  const t = useTranslations("today");
  const tc = useTranslations("common");
  const toast = useToast();
  const { run, pending, error } = useServerAction();
  return (
    <div className="flex flex-col gap-0.5">
      <FormMessage error={error ? tc("errorBody") : null} />
      <Button
        size="lg"
        className={primaryClass}
        disabled={pending}
        aria-busy={pending}
        onClick={() =>
          run(
            () => rescheduleWorkout(id, today, time),
            () => toast(t("toast.moved")),
          )
        }
      >
        <CalendarDays aria-hidden="true" />
        {t("card.moveToToday")}
      </Button>
      <button
        type="button"
        className={cn(secondaryClass, "text-ink pressable disabled:opacity-45")}
        disabled={pending}
        onClick={() =>
          run(
            () => setSkipped(id, true),
            () => toast(t("toast.skipped")),
          )
        }
      >
        <SkipForward aria-hidden="true" className="size-4" strokeWidth={2.4} />
        {t("card.markSkipped")}
      </button>
    </div>
  );
}

/** Plan this week via plan_week(); the toast reuses calendar.planWeekDone. */
export function PlanWeekAction({ weekStart }: { weekStart: string }) {
  const t = useTranslations("today.card");
  const tcal = useTranslations("calendar");
  const tc = useTranslations("common");
  const toast = useToast();
  const { run, pending, error } = useServerAction();
  return (
    <>
      <FormMessage error={error ? tc("errorBody") : null} />
      <Button
        size="lg"
        className={primaryClass}
        disabled={pending}
        aria-busy={pending}
        onClick={() =>
          run(async () => {
            const result = await planWeek(weekStart);
            if (result.ok) toast(tcal("planWeekDone", { count: result.count ?? 0 }));
            return result;
          })
        }
      >
        {t("planButton")}
      </Button>
    </>
  );
}

/** Creates and activates the starter program (the action then opens it). */
export function StarterAction() {
  const t = useTranslations("today.card");
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="accent"
      size="lg"
      className={primaryClass}
      disabled={pending}
      aria-busy={pending}
      onClick={() =>
        startTransition(async () => {
          await createStarterProgram();
        })
      }
    >
      {t("useStarter")}
    </Button>
  );
}
