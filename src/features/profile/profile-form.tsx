"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { FormMessage } from "@/components/app/form-message";
import { useServerAction } from "@/lib/hooks/use-server-action";
import type { Locale } from "@/lib/i18n/config";
import type { Goal } from "@/lib/validation/profile";
import { updateProfile } from "./actions";
import { GoalPicker, LanguageSelect, TimezoneSelect, WeekdayPicker } from "./profile-fields";

export function ProfileForm({
  initial,
}: {
  initial: {
    displayName: string;
    locale: Locale;
    timezone: string;
    goals: Goal[];
    preferredWeekdays: number[];
  };
}) {
  const t = useTranslations("profile");
  const to = useTranslations("onboarding");
  const tc = useTranslations("common");
  const { run, pending, error } = useServerAction();
  const [v, setV] = useState(initial);
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof typeof v>(k: K, value: (typeof v)[K]) => {
    setSaved(false);
    setV((s) => ({ ...s, [k]: value }));
  };

  return (
    <Card>
      <h2 className="mb-3 text-lg font-bold">{t("preferences")}</h2>
      <FormMessage error={error ? tc("errorBody") : null} success={saved ? t("saved") : null} />
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          run(
            () => updateProfile(v),
            () => setSaved(true),
          );
        }}
      >
        <Field label={to("aboutYou")}>
          {({ id }) => (
            <Input
              id={id}
              value={v.displayName}
              maxLength={60}
              onChange={(e) => set("displayName", e.target.value)}
            />
          )}
        </Field>
        <LanguageSelect value={v.locale} onChange={(l) => set("locale", l)} />
        <TimezoneSelect value={v.timezone} onChange={(tz) => set("timezone", tz)} />
        <GoalPicker value={v.goals} onChange={(g) => set("goals", g)} />
        <WeekdayPicker
          value={v.preferredWeekdays}
          onChange={(d) => set("preferredWeekdays", d)}
          legend={to("daysTitle")}
        />
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? tc("saving") : tc("save")}
        </Button>
      </form>
    </Card>
  );
}
