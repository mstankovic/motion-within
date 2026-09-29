import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChartNoAxesColumn, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CalendarWorkout } from "./queries";

/** The one primary action for a workout: start, continue or view summary. */
export function WorkoutCta({
  workout,
  size = "lg",
}: {
  workout: CalendarWorkout;
  size?: "lg" | "md";
}) {
  const t = useTranslations("calendar");
  if (workout.status === "completed" && workout.sessionId) {
    return (
      <Button asChild size={size} variant="secondary">
        <Link href={`/sessions/${workout.sessionId}`}>
          <ChartNoAxesColumn aria-hidden="true" />
          {t("viewSummary")}
        </Link>
      </Button>
    );
  }
  if (workout.status === "in_progress" && workout.sessionId) {
    return (
      <Button asChild size={size}>
        <Link href={`/sessions/${workout.sessionId}`}>
          <RotateCcw aria-hidden="true" />
          {t("continue")}
        </Link>
      </Button>
    );
  }
  if (workout.status === "planned" && workout.program_day_id) {
    return (
      <Button asChild size={size}>
        <Link href={`/workouts/${workout.id}/start`}>
          <Play aria-hidden="true" />
          {t("start")}
        </Link>
      </Button>
    );
  }
  return null;
}
