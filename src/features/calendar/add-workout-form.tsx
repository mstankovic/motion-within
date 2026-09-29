"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { FormMessage } from "@/components/app/form-message";
import { useServerAction } from "@/lib/hooks/use-server-action";
import { addScheduledWorkout } from "./actions";

export function AddWorkoutForm({
  date,
  title,
  days,
}: {
  date: string;
  title: string;
  days: { id: string; title: string }[];
}) {
  const t = useTranslations("calendar.day");
  const tc = useTranslations("common");
  const { run, pending, error } = useServerAction();
  const [dayId, setDayId] = useState(days[0]?.id ?? "");
  const [time, setTime] = useState("");
  const [added, setAdded] = useState(false);

  if (!days.length) return <p className="text-ink-muted text-sm">{t("noDays")}</p>;

  return (
    <Card>
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      <FormMessage error={error ? tc("errorBody") : null} success={added ? t("added") : null} />
      <form
        className="grid grid-cols-2 gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setAdded(false);
          run(
            () => addScheduledWorkout(date, dayId, time || null),
            () => setAdded(true),
          );
        }}
      >
        <Field label={t("chooseDay")} className="col-span-2">
          {({ id }) => (
            <Select id={id} value={dayId} onChange={(e) => setDayId(e.target.value)}>
              {days.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={`${t("time")} · ${tc("optional")}`}>
          {({ id }) => (
            <Input id={id} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          )}
        </Field>
        <div className="flex items-end">
          <Button type="submit" className="w-full" disabled={pending}>
            <Plus aria-hidden="true" />
            {tc("add")}
          </Button>
        </div>
      </form>
    </Card>
  );
}
