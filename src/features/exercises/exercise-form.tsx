"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { FormMessage } from "@/components/app/form-message";
import { cn } from "@/lib/cn";
import type { TrackingMode } from "@/features/workout-session/types";
import { refName, TRACKING_MODES, type RefItem } from "./model";
import { saveExercise } from "./actions";

type Initial = {
  id: string | null;
  name: string;
  description: string;
  trackingMode: TrackingMode;
  isMobility: boolean;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
};

function ChipGroup({
  legend,
  items,
  value,
  onChange,
  disabled = [],
}: {
  legend: string;
  items: RefItem[];
  value: string[];
  onChange: (v: string[]) => void;
  disabled?: string[];
}) {
  const locale = useLocale();
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => {
          const checked = value.includes(item.id);
          const isDisabled = disabled.includes(item.id);
          return (
            <label
              key={item.id}
              className={cn(
                "has-[:focus-visible]:outline-brand flex min-h-11 cursor-pointer items-center rounded-full border px-3 text-sm font-semibold has-[:focus-visible]:outline-3",
                checked
                  ? "border-brand bg-brand-soft text-brand-strong"
                  : "border-border bg-surface",
                isDisabled && "cursor-not-allowed opacity-40",
              )}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                disabled={isDisabled}
                onChange={() =>
                  onChange(checked ? value.filter((v) => v !== item.id) : [...value, item.id])
                }
              />
              {refName(item, locale)}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function ExerciseForm({
  initial,
  muscles,
  equipment,
}: {
  initial: Initial;
  muscles: RefItem[];
  equipment: RefItem[];
}) {
  const t = useTranslations("exercises");
  const tc = useTranslations("common");
  const tp = useTranslations("programs");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState(initial);
  const set = <K extends keyof Initial>(key: K, value: Initial[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!state.name.trim()) {
      setError(tp("errors.nameRequired"));
      return;
    }
    startTransition(async () => {
      const result = await saveExercise(state.id, {
        name: state.name,
        description: state.description,
        trackingMode: state.trackingMode,
        isMobility: state.isMobility,
        primaryMuscles: state.primaryMuscles,
        secondaryMuscles: state.secondaryMuscles,
        equipment: state.equipment,
      });
      if (!result.ok) {
        setError(tc("errorBody"));
        return;
      }
      router.push(`/exercises/${result.id}`);
      router.refresh();
    });
  }

  return (
    <Card>
      <FormMessage error={error} />
      <form onSubmit={submit} className="space-y-5">
        <Field label={t("name")}>
          {({ id }) => (
            <Input
              id={id}
              value={state.name}
              maxLength={120}
              required
              onChange={(e) => set("name", e.target.value)}
            />
          )}
        </Field>
        <Field label={`${t("description")} · ${tc("optional")}`}>
          {({ id }) => (
            <Textarea
              id={id}
              value={state.description}
              maxLength={2000}
              onChange={(e) => set("description", e.target.value)}
            />
          )}
        </Field>
        <Field label={t("tracking")}>
          {({ id }) => (
            <Select
              id={id}
              value={state.trackingMode}
              onChange={(e) => set("trackingMode", e.target.value as TrackingMode)}
            >
              {TRACKING_MODES.map((m) => (
                <option key={m} value={m}>
                  {t(`trackingMode.${m}`)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <label className="flex min-h-11 cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            className="size-5 accent-[var(--color-brand)]"
            checked={state.isMobility}
            onChange={(e) => set("isMobility", e.target.checked)}
          />
          <span className="font-semibold">{t("isMobility")}</span>
        </label>
        <ChipGroup
          legend={`${t("muscle")} · ${t("primary")}`}
          items={muscles}
          value={state.primaryMuscles}
          onChange={(v) => set("primaryMuscles", v)}
          disabled={state.secondaryMuscles}
        />
        <ChipGroup
          legend={`${t("muscle")} · ${t("secondary")}`}
          items={muscles}
          value={state.secondaryMuscles}
          onChange={(v) => set("secondaryMuscles", v)}
          disabled={state.primaryMuscles}
        />
        <ChipGroup
          legend={t("equipment")}
          items={equipment}
          value={state.equipment}
          onChange={(v) => set("equipment", v)}
        />
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? tc("saving") : tc("save")}
        </Button>
      </form>
    </Card>
  );
}
