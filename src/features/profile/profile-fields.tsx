"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Field, Select } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { GOALS, type Goal } from "@/lib/validation/profile";
import type { Locale } from "@/lib/i18n/config";

const chip =
  "flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-brand";

export function LanguageSelect({
  value,
  onChange,
}: {
  value: Locale;
  onChange: (locale: Locale) => void;
}) {
  const t = useTranslations("onboarding");
  return (
    <Field label={t("language")}>
      {({ id }) => (
        <Select id={id} value={value} onChange={(e) => onChange(e.target.value as Locale)}>
          <option value="sr">Srpski (latinica)</option>
          <option value="en">English</option>
        </Select>
      )}
    </Field>
  );
}

export function TimezoneSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (tz: string) => void;
}) {
  const t = useTranslations("onboarding");
  const zones = useMemo(() => {
    const list =
      typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
    return list.includes(value) ? list : [value, ...list];
  }, [value]);
  return (
    <Field label={t("timezone")}>
      {({ id }) => (
        <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
          {zones.map((z) => (
            <option key={z} value={z}>
              {z.replaceAll("_", " ")}
            </option>
          ))}
        </Select>
      )}
    </Field>
  );
}

export function GoalPicker({
  value,
  onChange,
}: {
  value: Goal[];
  onChange: (goals: Goal[]) => void;
}) {
  const t = useTranslations("onboarding");
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">{t("goalsTitle")}</legend>
      <div className="flex flex-wrap gap-2">
        {GOALS.map((goal) => {
          const checked = value.includes(goal);
          return (
            <label
              key={goal}
              className={cn(
                chip,
                checked
                  ? "border-brand bg-brand-soft text-brand-strong"
                  : "border-border bg-surface",
              )}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={() =>
                  onChange(checked ? value.filter((g) => g !== goal) : [...value, goal])
                }
              />
              {checked ? <Check aria-hidden="true" className="size-4" /> : null}
              {t(`goals.${goal}`)}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function WeekdayPicker({
  value,
  onChange,
  legend,
}: {
  value: number[];
  onChange: (days: number[]) => void;
  legend: string;
}) {
  const t = useTranslations();
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">{legend}</legend>
      <div className="grid grid-cols-7 gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7].map((day) => {
          const checked = value.includes(day);
          const key = String(day) as "1";
          return (
            <label
              key={day}
              className={cn(
                "has-[:focus-visible]:outline-brand flex min-h-12 cursor-pointer flex-col items-center justify-center rounded-[var(--radius-control)] border text-sm font-bold has-[:focus-visible]:outline-3",
                checked ? "border-brand bg-brand text-on-brand" : "border-border bg-surface",
              )}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                aria-label={t(`weekdays.${key}`)}
                onChange={() =>
                  onChange(
                    checked
                      ? value.filter((d) => d !== day)
                      : [...value, day].sort((a, b) => a - b),
                  )
                }
              />
              <span aria-hidden="true">{t(`weekdaysShort.${key}`)}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
