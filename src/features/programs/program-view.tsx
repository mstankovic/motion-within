import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { exerciseName } from "@/features/exercises/model";
import type { ProgramTree } from "./queries";
import { PlanSummary } from "./plan-summary";

export function ProgramView({ program }: { program: ProgramTree }) {
  const t = useTranslations();
  const locale = useLocale();

  if (!program.program_days.length) {
    return <EmptyState title={t("programs.noDays")} />;
  }

  return (
    <div className="space-y-4">
      {program.program_days.map((day) => (
        <Card key={day.id}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold">{day.title}</h2>
            <Badge tone="brand">{t(`intensity.${day.intensity}`)}</Badge>
            {day.preferred_weekday ? (
              <Badge>{t(`weekdays.${String(day.preferred_weekday) as "1"}`)}</Badge>
            ) : null}
          </div>
          {day.workout_blocks.length === 0 ? (
            <p className="text-ink-muted text-sm">{t("programs.noBlocks")}</p>
          ) : (
            <ol className="space-y-3">
              {day.workout_blocks.map((block) => (
                <li
                  key={block.id}
                  className="border-border rounded-[var(--radius-control)] border p-3"
                >
                  {block.block_type !== "single" || block.title ? (
                    <p className="text-accent mb-2 text-xs font-bold tracking-wide uppercase">
                      {t(`programs.blockType.${block.block_type}`)}
                      {block.title ? ` · ${block.title}` : ""}
                      {block.block_type === "circuit"
                        ? ` · ${t("workout.planRounds", { count: block.rounds })}`
                        : ""}
                    </p>
                  ) : null}
                  <ul className="space-y-2">
                    {block.block_exercises.map((be) => (
                      <li key={be.id}>
                        <p className="font-semibold">
                          {be.exercises ? exerciseName(be.exercises, locale) : "—"}
                        </p>
                        {be.exercises ? (
                          <PlanSummary
                            className="text-ink-muted text-sm"
                            plan={{
                              trackingMode: be.exercises.tracking_mode,
                              blockType: block.block_type,
                              rounds: block.rounds,
                              targetSets: be.target_sets,
                              targetRepsMin: be.target_reps_min,
                              targetRepsMax: be.target_reps_max,
                              targetDurationSeconds: be.target_duration_seconds,
                              targetWeightKg: be.target_weight_kg,
                              targetBandLabel: be.target_band_label,
                              targetTrxPosition: be.target_trx_position,
                              tempo: be.tempo,
                              restSeconds: be.rest_seconds,
                            }}
                          />
                        ) : null}
                        {be.notes ? (
                          <p className="text-ink-subtle text-sm italic">{be.notes}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          )}
        </Card>
      ))}
    </div>
  );
}
