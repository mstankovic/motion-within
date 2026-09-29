"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import type { LocalSet, SetValues, TrackingMode } from "../types";
import { Stepper } from "./stepper";

/** Short tap-back where the platform supports it (Android); silent elsewhere. */
function haptic(ms: number) {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  navigator.vibrate?.(ms);
}

export function SetRow({
  set,
  mode,
  placeholderReps,
  placeholderDuration,
  onChange,
  onToggle,
}: {
  set: LocalSet;
  mode: TrackingMode;
  placeholderReps?: number | null;
  placeholderDuration?: number | null;
  onChange: (patch: Partial<SetValues>) => void;
  onToggle: () => void;
}) {
  const t = useTranslations("workout");
  const label = t("set", { n: set.set_number });
  const hasReps = mode !== "duration";
  const hasDuration = mode === "duration" || mode === "reps_duration";
  const dec = (what: string) => t("decrease", { label: `${label} ${what}` });
  const inc = (what: string) => t("increase", { label: `${label} ${what}` });

  return (
    <li
      className={cn(
        "ease-standard rounded-[var(--radius-control)] border p-3 transition-colors duration-(--dur-slow)",
        set.completed ? "border-success bg-success-soft" : "border-border bg-surface",
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[0.9375rem] font-bold">{label}</span>
        <label className="flex items-center gap-1.5 text-sm">
          <span className="text-ink-muted">{t("rpe")}</span>
          <select
            aria-label={`${label} ${t("rpe")}`}
            value={set.rpe ?? ""}
            onChange={(e) => onChange({ rpe: e.target.value ? Number(e.target.value) : null })}
            className="border-border bg-surface h-11 rounded-[var(--radius-control)] border px-2 font-semibold"
          >
            <option value="">–</option>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex items-end gap-2">
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
          {hasReps ? (
            <div className={cn(mode === "reps" && !hasDuration && "col-span-2")}>
              <span className="text-ink-muted mb-0.5 block text-xs font-semibold">{t("reps")}</span>
              <Stepper
                label={`${label} ${t("reps")}`}
                value={set.reps}
                placeholder={placeholderReps != null ? String(placeholderReps) : undefined}
                onChange={(reps) => onChange({ reps })}
                decreaseLabel={dec(t("reps"))}
                increaseLabel={inc(t("reps"))}
              />
            </div>
          ) : null}
          {hasDuration ? (
            <div className={cn(mode === "duration" && "col-span-2")}>
              <span className="text-ink-muted mb-0.5 block text-xs font-semibold">
                {t("duration")}
              </span>
              <Stepper
                label={`${label} ${t("duration")}`}
                value={set.duration_seconds}
                step={5}
                placeholder={placeholderDuration != null ? String(placeholderDuration) : undefined}
                onChange={(duration_seconds) => onChange({ duration_seconds })}
                decreaseLabel={dec(t("duration"))}
                increaseLabel={inc(t("duration"))}
              />
            </div>
          ) : null}
          {mode === "reps_weight" ? (
            <div>
              <span className="text-ink-muted mb-0.5 block text-xs font-semibold">
                {t("weight")}
              </span>
              <Stepper
                label={`${label} ${t("weight")}`}
                value={set.weight_kg == null ? null : Number(set.weight_kg)}
                step={1}
                decimal
                onChange={(weight_kg) => onChange({ weight_kg })}
                decreaseLabel={dec(t("weight"))}
                increaseLabel={inc(t("weight"))}
              />
            </div>
          ) : null}
          {mode === "reps_band" || mode === "reps_trx" ? (
            <label className="block">
              <span className="text-ink-muted mb-0.5 block text-xs font-semibold">
                {mode === "reps_band" ? t("band") : t("trx")}
              </span>
              <input
                type="text"
                maxLength={60}
                value={(mode === "reps_band" ? set.band_label : set.trx_position) ?? ""}
                onChange={(e) =>
                  onChange(
                    mode === "reps_band"
                      ? { band_label: e.target.value || null }
                      : { trx_position: e.target.value || null },
                  )
                }
                className="border-border bg-surface focus-visible:border-brand h-[3.25rem] w-full rounded-[var(--radius-control)] border px-3 font-semibold focus-visible:shadow-[0_0_0_4px_var(--color-brand-soft)] focus-visible:outline-none"
              />
            </label>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => {
            if (!set.completed) haptic(12);
            onToggle();
          }}
          aria-pressed={set.completed}
          aria-label={set.completed ? t("setDone") : t("setNotDone")}
          className={cn(
            "pressable-sm relative flex size-13 shrink-0 items-center justify-center rounded-full border-2",
            set.completed
              ? "border-success bg-success text-on-success animate-pop"
              : "border-border bg-surface text-ink-subtle",
          )}
        >
          {set.completed ? (
            <span
              aria-hidden="true"
              className="animate-ring pointer-events-none absolute -inset-0.5 rounded-full opacity-0"
            />
          ) : null}
          <Check
            aria-hidden="true"
            className={cn(
              "size-6.5",
              set.completed && "[&_path]:animate-draw [&_path]:[stroke-dasharray:24]",
            )}
            strokeWidth={3}
          />
        </button>
      </div>
    </li>
  );
}
