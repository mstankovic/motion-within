"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { NumberInput } from "@/components/ui/number-input";
import { FormMessage } from "@/components/app/form-message";
import { useServerAction } from "@/lib/hooks/use-server-action";
import { saveMeasurement } from "./actions";

const EXTRA = [
  ["chestCm", "chest"],
  ["hipsCm", "hips"],
  ["upperArmCm", "upperArm"],
  ["thighCm", "thigh"],
] as const;

export function MeasurementForm({ today }: { today: string }) {
  const t = useTranslations("body");
  const tc = useTranslations("common");
  const { run, pending, error } = useServerAction();
  const [saved, setSaved] = useState(false);
  const [more, setMore] = useState(false);
  const empty = {
    weightKg: null,
    waistCm: null,
    chestCm: null,
    hipsCm: null,
    upperArmCm: null,
    thighCm: null,
  } as Record<string, number | null>;
  const [values, setValues] = useState(empty);
  const [date, setDate] = useState(today);
  const [notes, setNotes] = useState("");
  const set = (k: string, v: number | null) => setValues((s) => ({ ...s, [k]: v }));

  return (
    <Card>
      <FormMessage
        error={error === "atLeastOne" ? t("atLeastOne") : error ? tc("errorBody") : null}
        success={saved ? t("saved") : null}
      />
      <form
        className="grid grid-cols-2 gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setSaved(false);
          run(
            () =>
              saveMeasurement({
                measuredOn: date,
                weightKg: values.weightKg,
                waistCm: values.waistCm,
                chestCm: values.chestCm,
                hipsCm: values.hipsCm,
                upperArmCm: values.upperArmCm,
                thighCm: values.thighCm,
                notes: notes || null,
              }),
            () => {
              setSaved(true);
              setValues(empty);
              setNotes("");
            },
          );
        }}
      >
        <Field label={t("date")} className="col-span-2" hint={t("sameDayNote")}>
          {({ id, describedBy }) => (
            <Input
              id={id}
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
              aria-describedby={describedBy}
              required
            />
          )}
        </Field>
        <Field label={t("weight")}>
          {({ id }) => (
            <NumberInput
              id={id}
              decimal
              value={values.weightKg}
              onValueChange={(v) => set("weightKg", v)}
            />
          )}
        </Field>
        <Field label={t("waist")}>
          {({ id }) => (
            <NumberInput
              id={id}
              decimal
              value={values.waistCm}
              onValueChange={(v) => set("waistCm", v)}
            />
          )}
        </Field>
        {more
          ? EXTRA.map(([key, label]) => (
              <Field key={key} label={t(label)}>
                {({ id }) => (
                  <NumberInput
                    id={id}
                    decimal
                    value={values[key]}
                    onValueChange={(v) => set(key, v)}
                  />
                )}
              </Field>
            ))
          : null}
        {!more ? (
          <Button
            variant="ghost"
            size="sm"
            className="col-span-2 justify-start"
            onClick={() => setMore(true)}
            aria-expanded={false}
          >
            + {t("more")}
          </Button>
        ) : null}
        <Field label={`${t("notes")} · ${tc("optional")}`} className="col-span-2">
          {({ id }) => (
            <Textarea
              id={id}
              value={notes}
              maxLength={1000}
              onChange={(e) => setNotes(e.target.value)}
            />
          )}
        </Field>
        <Button type="submit" className="col-span-2" size="lg" disabled={pending}>
          {pending ? tc("saving") : t("save")}
        </Button>
      </form>
    </Card>
  );
}
