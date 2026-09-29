"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarClock, RotateCcw, SkipForward, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { FormMessage } from "@/components/app/form-message";
import { useServerAction } from "@/lib/hooks/use-server-action";
import { removeScheduledWorkout, rescheduleWorkout, setSkipped } from "./actions";
import type { CalendarWorkout } from "./queries";

export function DayWorkoutItem({
  workout,
  cta,
  statusBadge,
}: {
  workout: CalendarWorkout;
  cta: React.ReactNode;
  statusBadge: React.ReactNode;
}) {
  const t = useTranslations("calendar.day");
  const ti = useTranslations("intensity");
  const tc = useTranslations("common");
  const tcal = useTranslations("calendar");
  const { run, pending, error } = useServerAction();
  const [moving, setMoving] = useState(false);
  const [date, setDate] = useState(workout.planned_date);
  const [time, setTime] = useState(workout.planned_time?.slice(0, 5) ?? "");
  const [notice, setNotice] = useState<string | null>(null);
  const editable = workout.status === "planned" || workout.status === "skipped";

  return (
    <Card className="space-y-3">
      <div>
        <p className="text-lg font-bold">{workout.title}</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {statusBadge}
          {workout.intensity ? <Badge tone="brand">{ti(workout.intensity)}</Badge> : null}
          {workout.exerciseCount != null ? (
            <Badge>{tcal("exerciseCount", { count: workout.exerciseCount })}</Badge>
          ) : null}
          {workout.planned_time ? <Badge>{workout.planned_time.slice(0, 5)}</Badge> : null}
        </div>
      </div>
      <FormMessage error={error ? tc("errorBody") : null} success={notice} />
      {cta}
      {editable ? (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setMoving((m) => !m)}
            aria-expanded={moving}
          >
            <CalendarClock aria-hidden="true" />
            {t("move")}
          </Button>
          {workout.status === "planned" ? (
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() =>
                run(
                  () => setSkipped(workout.id, true),
                  () => setNotice(t("skipped")),
                )
              }
            >
              <SkipForward aria-hidden="true" />
              {t("skip")}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => run(() => setSkipped(workout.id, false))}
            >
              <RotateCcw aria-hidden="true" />
              {t("unskip")}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => run(() => removeScheduledWorkout(workout.id))}
          >
            <Trash2 aria-hidden="true" />
            {t("delete")}
          </Button>
        </div>
      ) : null}
      {moving ? (
        <form
          className="grid grid-cols-2 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(
              () => rescheduleWorkout(workout.id, date, time || null),
              () => {
                setMoving(false);
                setNotice(t("moved"));
              },
            );
          }}
        >
          <Field label={t("moveTo")}>
            {({ id }) => (
              <Input
                id={id}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            )}
          </Field>
          <Field label={`${t("time")} · ${tc("optional")}`}>
            {({ id }) => (
              <Input id={id} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            )}
          </Field>
          <Button type="submit" className="col-span-2" disabled={pending}>
            {tc("save")}
          </Button>
        </form>
      ) : null}
    </Card>
  );
}
