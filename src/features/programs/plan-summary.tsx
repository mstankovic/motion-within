import { useLocale, useTranslations } from "next-intl";
import { formatNumber } from "@/lib/dates";
import { formatRepsTarget } from "@/features/workout-session/plan";
import type { BlockType, TrackingMode } from "@/features/workout-session/types";

export type PlanTargets = {
  trackingMode: TrackingMode;
  blockType: BlockType;
  rounds: number;
  targetSets: number;
  targetRepsMin: number | null;
  targetRepsMax: number | null;
  targetDurationSeconds: number | null;
  targetWeightKg: number | null;
  targetBandLabel: string | null;
  targetTrxPosition: string | null;
  tempo: string | null;
  restSeconds: number | null;
};

/** "3 sets · 8–12 reps · 10 kg · Tempo 3-1-1 · Rest 60s" — shared by program view and workout. */
export function PlanSummary({ plan, className }: { plan: PlanTargets; className?: string }) {
  const t = useTranslations("workout");
  const tc = useTranslations("common");
  const locale = useLocale();
  const parts: string[] = [];

  parts.push(
    plan.blockType === "circuit"
      ? t("planRounds", { count: plan.rounds })
      : t("planSets", { count: plan.targetSets }),
  );
  const reps = formatRepsTarget({ min: plan.targetRepsMin, max: plan.targetRepsMax });
  if (reps && plan.trackingMode !== "duration") parts.push(`${reps} ${tc("reps")}`);
  if (
    plan.targetDurationSeconds != null &&
    (plan.trackingMode === "duration" || plan.trackingMode === "reps_duration")
  ) {
    parts.push(`${plan.targetDurationSeconds} ${tc("seconds")}`);
  }
  if (plan.trackingMode === "reps_weight" && plan.targetWeightKg != null) {
    parts.push(`${formatNumber(plan.targetWeightKg, locale, 2)} ${tc("kg")}`);
  }
  if (plan.trackingMode === "reps_band" && plan.targetBandLabel) parts.push(plan.targetBandLabel);
  if (plan.trackingMode === "reps_trx" && plan.targetTrxPosition)
    parts.push(`TRX ${plan.targetTrxPosition}`);
  if (plan.tempo) parts.push(t("tempo", { value: plan.tempo }));
  if (plan.restSeconds != null) parts.push(t("rest", { value: plan.restSeconds }));

  return <p className={className}>{parts.join(" · ")}</p>;
}
