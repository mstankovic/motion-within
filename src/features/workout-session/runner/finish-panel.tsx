"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Select, Textarea } from "@/components/ui/field";
import { ScalePicker } from "@/components/ui/scale-picker";
import { Notice } from "@/components/ui/states";
import type { LocalSession } from "../types";

export type FinishValues = {
  session_rpe: number | null;
  energy_after: number | null;
  recovery_rating: number | null;
  notes: string;
  painExerciseId: string | null;
  painNote: string;
};

export function FinishPanel({
  state,
  submitLabel,
  pending,
  onSubmit,
}: {
  state: LocalSession;
  submitLabel: string;
  pending: boolean;
  onSubmit: (values: FinishValues) => void;
}) {
  const t = useTranslations("workout");
  const tc = useTranslations("common");
  const s = state.session;
  const flagged = state.exercises.find((e) => e.pain_flag);
  const [values, setValues] = useState<FinishValues>({
    session_rpe: s.session_rpe,
    energy_after: s.energy_after,
    recovery_rating: s.recovery_rating,
    notes: s.notes ?? "",
    painExerciseId: flagged?.id ?? null,
    painNote: flagged?.pain_note ?? "",
  });
  const [pain, setPain] = useState(Boolean(flagged));
  const set = <K extends keyof FinishValues>(k: K, v: FinishValues[K]) =>
    setValues((x) => ({ ...x, [k]: v }));

  return (
    <Card className="space-y-5">
      <h2 className="text-xl font-extrabold">{t("finishTitle")}</h2>
      <ScalePicker
        name="rpe"
        label={t("sessionRpe")}
        max={10}
        value={values.session_rpe}
        onChange={(v) => set("session_rpe", v)}
      />
      <ScalePicker
        name="energy"
        label={t("energyAfter")}
        max={5}
        value={values.energy_after}
        onChange={(v) => set("energy_after", v)}
      />
      <ScalePicker
        name="recovery"
        label={t("recovery")}
        max={5}
        value={values.recovery_rating}
        onChange={(v) => set("recovery_rating", v)}
      />
      <Field label={`${t("sessionNotes")} · ${tc("optional")}`}>
        {({ id }) => (
          <Textarea
            id={id}
            value={values.notes}
            maxLength={2000}
            onChange={(e) => set("notes", e.target.value)}
          />
        )}
      </Field>

      <fieldset className="space-y-3">
        <legend className="mb-1.5 text-sm font-semibold">{t("painQuestion")}</legend>
        <div className="flex gap-2">
          {[false, true].map((option) => (
            <label
              key={String(option)}
              className="border-border bg-surface has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:focus-visible]:outline-brand flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-[var(--radius-control)] border font-semibold has-[:focus-visible]:outline-3"
            >
              <input
                type="radio"
                name="pain"
                className="sr-only"
                checked={pain === option}
                onChange={() => {
                  setPain(option);
                  if (!option) set("painExerciseId", null);
                }}
              />
              {option ? tc("yes") : tc("no")}
            </label>
          ))}
        </div>
        {pain ? (
          <>
            <Field label={t("painExercise")}>
              {({ id }) => (
                <Select
                  id={id}
                  value={values.painExerciseId ?? ""}
                  onChange={(e) => set("painExerciseId", e.target.value || null)}
                >
                  <option value="">–</option>
                  {state.exercises.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.exercise_name_snapshot}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={`${t("painNote")} · ${tc("optional")}`}>
              {({ id }) => (
                <Textarea
                  id={id}
                  value={values.painNote}
                  maxLength={1000}
                  onChange={(e) => set("painNote", e.target.value)}
                />
              )}
            </Field>
            <Notice>{t("painInfo")}</Notice>
          </>
        ) : null}
      </fieldset>

      <Button
        size="lg"
        disabled={pending}
        onClick={() => onSubmit(pain ? values : { ...values, painExerciseId: null })}
      >
        {pending ? tc("saving") : submitLabel}
      </Button>
    </Card>
  );
}
