"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { NumberInput } from "@/components/ui/number-input";
import { FormMessage } from "@/components/app/form-message";
import { formatNumber } from "@/lib/dates";
import { useServerAction } from "@/lib/hooks/use-server-action";
import { acceptSuggestion, dismissSuggestion } from "./actions";
import type { ReasonCode, SuggestionType } from "./engine";

export type SuggestionView = {
  id: string;
  exerciseName: string;
  type: SuggestionType;
  reasonCode: ReasonCode;
  reasonPayload: Record<string, string | number | null>;
  suggestedPayload: Record<string, unknown>;
};

const INCREASE: SuggestionType[] = [
  "increase_weight",
  "harder_band",
  "harder_trx",
  "increase_reps",
  "harder_variation",
];

export function SuggestionCard({ suggestion: s }: { suggestion: SuggestionView }) {
  const t = useTranslations("suggestion");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { run, pending, error } = useServerAction();
  const [editing, setEditing] = useState(s.type === "harder_band" || s.type === "harder_trx");
  const [numberValue, setNumberValue] = useState<number | null>(
    s.type === "increase_weight"
      ? Number(s.suggestedPayload.to)
      : s.type === "increase_reps"
        ? Number(s.suggestedPayload.max)
        : null,
  );
  const [textValue, setTextValue] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const p = s.suggestedPayload;
  const fmt = (v: unknown) => formatNumber(Number(v), locale, 2);

  const title = t(`types.${s.type}`, {
    from: fmt(p.from),
    to: fmt(p.to),
    min: String(p.min ?? ""),
    max: String(p.max ?? ""),
  });
  const reason = t(`reasons.${s.reasonCode}`, {
    reps: String(s.reasonPayload.reps ?? ""),
    rpe: String(s.reasonPayload.rpe ?? ""),
    min: String(s.reasonPayload.min ?? ""),
  });
  const isIncrease = INCREASE.includes(s.type);
  const errorText =
    error === "stale"
      ? t("stale")
      : error === "needs_value"
        ? t("newValue")
        : error
          ? tc("errorBody")
          : null;

  if (done) {
    return (
      <Card className="p-3">
        <p role="status" className="text-success text-sm font-semibold">
          {s.exerciseName}: {done}
        </p>
      </Card>
    );
  }

  const edited = s.type === "harder_band" || s.type === "harder_trx" ? textValue : numberValue;

  return (
    <Card className="space-y-3">
      <div className="flex gap-3">
        <Lightbulb aria-hidden="true" className="text-accent mt-0.5 size-5 shrink-0" />
        <div>
          <p className="text-ink-muted text-sm font-semibold">{s.exerciseName}</p>
          <p className="font-bold">{title}</p>
          <p className="text-ink-muted mt-1 text-sm">{reason}</p>
        </div>
      </div>
      <FormMessage error={errorText} />
      {isIncrease && editing && s.type !== "harder_variation" ? (
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">{t("newValue")}</span>
          {s.type === "harder_band" || s.type === "harder_trx" ? (
            <Input
              value={textValue}
              maxLength={60}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder={String(p.from ?? "")}
            />
          ) : (
            <NumberInput
              decimal={s.type === "increase_weight"}
              value={numberValue}
              onValueChange={setNumberValue}
            />
          )}
        </label>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {isIncrease ? (
          <>
            <Button
              size="sm"
              disabled={pending}
              onClick={() =>
                run(
                  () => acceptSuggestion(s.id, editing ? edited : undefined),
                  () => setDone(t("accepted")),
                )
              }
            >
              {t("accept")}
            </Button>
            {!editing && s.type !== "harder_variation" ? (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                {t("edit")}
              </Button>
            ) : null}
          </>
        ) : null}
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() =>
            run(
              () => dismissSuggestion(s.id),
              () => setDone(t("dismissed")),
            )
          }
        >
          {isIncrease ? t("dismiss") : tc("done")}
        </Button>
        {isIncrease ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() =>
              run(
                () => dismissSuggestion(s.id, true),
                () => setDone(t("snoozed")),
              )
            }
          >
            {t("snooze")}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
