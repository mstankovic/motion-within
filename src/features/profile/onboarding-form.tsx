"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/states";
import { FormMessage } from "@/components/app/form-message";
import type { Locale } from "@/lib/i18n/config";
import type { Goal } from "@/lib/validation/profile";
import { completeOnboarding, setLanguage } from "./actions";
import { GoalPicker, LanguageSelect, TimezoneSelect, WeekdayPicker } from "./profile-fields";

const TOTAL_STEPS = 4;

export function OnboardingForm({
  initialName,
  initialLocale,
  initialTimezone,
}: {
  initialName: string;
  initialLocale: Locale;
  initialTimezone: string;
}) {
  const t = useTranslations("onboarding");
  const tc = useTranslations("common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState(initialName);
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [timezone, setTimezone] = useState(() => {
    if (initialTimezone !== "Europe/Podgorica") return initialTimezone;
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || initialTimezone;
    } catch {
      return initialTimezone;
    }
  });
  const [goals, setGoals] = useState<Goal[]>([]);
  const [days, setDays] = useState<number[]>([1, 3, 5]);
  const [createStarter, setCreateStarter] = useState(true);
  const [ack, setAck] = useState(false);

  function changeLanguage(next: Locale) {
    setLocale(next);
    startTransition(async () => {
      await setLanguage(next);
      router.refresh();
    });
  }

  function goNext() {
    setError(null);
    if (step === 2 && days.length === 0) {
      setError(t("errors.daysRequired"));
      return;
    }
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }

  function finish() {
    setError(null);
    if (!ack) {
      setError(t("errors.safetyRequired"));
      return;
    }
    startTransition(async () => {
      const result = await completeOnboarding({
        displayName,
        locale,
        timezone,
        goals,
        preferredWeekdays: days,
        createStarter,
        safetyAcknowledged: true,
      });
      if (result && !result.ok) setError(tc("errorBody"));
    });
  }

  return (
    <Card className="p-5">
      <p className="text-brand text-sm font-semibold">
        {t("step", { current: step, total: TOTAL_STEPS })}
      </p>
      <h1 className="mb-5 text-2xl font-extrabold tracking-tight">{t("title")}</h1>
      <FormMessage error={error} />

      {step === 1 ? (
        <div className="space-y-4">
          <Field label={`${t("aboutYou")} · ${tc("optional")}`}>
            {({ id }) => (
              <Input
                id={id}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="nickname"
                maxLength={60}
              />
            )}
          </Field>
          <LanguageSelect value={locale} onChange={changeLanguage} />
          <TimezoneSelect value={timezone} onChange={setTimezone} />
          <div>
            <p className="mb-1.5 text-sm font-semibold">{t("units")}</p>
            <p className="bg-surface-muted rounded-[var(--radius-control)] px-3 py-2.5 text-sm">
              {t("unitsMetric")}
            </p>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-6">
          <div>
            <GoalPicker value={goals} onChange={setGoals} />
            <p className="text-ink-muted mt-2 text-sm">{t("goalsHint")}</p>
          </div>
          <div>
            <WeekdayPicker value={days} onChange={setDays} legend={t("daysTitle")} />
            <p className="text-ink-muted mt-2 text-sm">{t("daysHint")}</p>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <fieldset className="space-y-3">
          <legend className="mb-1 text-lg font-bold">{t("starterTitle")}</legend>
          <p className="text-ink-muted text-sm">{t("starterBody")}</p>
          {[true, false].map((option) => (
            <label
              key={String(option)}
              className="border-border bg-surface has-[:checked]:border-brand has-[:checked]:bg-brand-soft flex min-h-12 cursor-pointer items-center gap-3 rounded-[var(--radius-control)] border px-4"
            >
              <input
                type="radio"
                name="starter"
                className="size-5 accent-[var(--color-brand)]"
                checked={createStarter === option}
                onChange={() => setCreateStarter(option)}
              />
              <span className="font-semibold">{option ? t("starterYes") : t("starterNo")}</span>
            </label>
          ))}
          <p className="text-ink-muted pt-2 text-sm">{t("remindersNote")}</p>
        </fieldset>
      ) : null}

      {step === 4 ? (
        <div className="space-y-4">
          <div className="text-brand flex items-center gap-2">
            <ShieldCheck aria-hidden="true" className="size-6" />
            <h2 className="text-ink text-lg font-bold">{t("safetyTitle")}</h2>
          </div>
          <Notice tone="info">{t("safetyBody")}</Notice>
          <label className="flex min-h-12 cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              className="size-6 accent-[var(--color-brand)]"
              checked={ack}
              onChange={(e) => setAck(e.target.checked)}
            />
            <span className="font-semibold">{t("safetyAck")}</span>
          </label>
        </div>
      ) : null}

      <div className="mt-6 flex gap-3">
        {step > 1 ? (
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setStep((s) => s - 1)}
            disabled={pending}
          >
            {tc("back")}
          </Button>
        ) : null}
        {step < TOTAL_STEPS ? (
          <Button className="flex-1" onClick={goNext} disabled={pending}>
            {tc("next")}
          </Button>
        ) : (
          <Button className="flex-1" onClick={finish} disabled={pending}>
            {pending ? tc("saving") : t("finish")}
          </Button>
        )}
      </div>
    </Card>
  );
}
