import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Performance } from "@/features/workout-session/types";
import { evaluateProgression, type PerformanceInput } from "./engine";

type Client = SupabaseClient<Database>;

export function toPerformanceInput(p: Performance): PerformanceInput {
  return {
    performedAt: p.performed_at,
    status: p.status,
    painFlag: p.pain_flag,
    sessionRpe: p.session_rpe ?? null,
    sets: p.sets.map((s) => ({
      reps: s.reps,
      weightKg: s.weight_kg == null ? null : Number(s.weight_kg),
      rpe: s.rpe,
      completed: s.completed,
      isWarmup: s.is_warmup,
    })),
  };
}

/**
 * Re-evaluates suggestions for every exercise in a session against the *current*
 * program plan. Existing pending suggestions for those exercises are replaced,
 * so edits to a finished session are reflected.
 */
export async function regenerateSuggestions(supabase: Client, userId: string, sessionId: string) {
  const { data: items } = await supabase
    .from("session_exercises")
    .select("source_exercise_id, source_block_exercise_id")
    .eq("session_id", sessionId)
    .not("source_exercise_id", "is", null);
  if (!items?.length) return;

  const now = new Date().toISOString();
  for (const item of items) {
    const exerciseId = item.source_exercise_id!;

    const { data: snoozed } = await supabase
      .from("progression_suggestions")
      .select("id")
      .eq("exercise_id", exerciseId)
      .eq("status", "snoozed")
      .gt("snoozed_until", now)
      .limit(1);

    // Pending suggestions are always recomputed from scratch.
    await supabase
      .from("progression_suggestions")
      .delete()
      .eq("exercise_id", exerciseId)
      .eq("status", "pending");
    if (snoozed?.length || !item.source_block_exercise_id) continue;

    const { data: plan } = await supabase
      .from("block_exercises")
      .select(
        "id, target_sets, target_reps_min, target_reps_max, target_weight_kg, target_band_label, target_trx_position, progression_step_kg, workout_blocks(block_type, rounds, program_days(program_id, programs(is_active))), exercises(tracking_mode, is_mobility)",
      )
      .eq("id", item.source_block_exercise_id)
      .maybeSingle();
    if (!plan?.exercises || !plan.workout_blocks?.program_days) continue;

    const { data: history } = await supabase.rpc("exercise_performances", {
      p_exercise_id: exerciseId,
      p_limit: 2,
    });
    const performances = ((history ?? []) as unknown as Performance[]).map(toPerformanceInput);

    const block = plan.workout_blocks;
    const suggestion = evaluateProgression(
      {
        trackingMode: plan.exercises.tracking_mode,
        isMobility: plan.exercises.is_mobility,
        targetSets: block.block_type === "circuit" ? block.rounds : plan.target_sets,
        targetRepsMin: plan.target_reps_min,
        targetRepsMax: plan.target_reps_max,
        targetWeightKg: plan.target_weight_kg,
        targetBandLabel: plan.target_band_label,
        targetTrxPosition: plan.target_trx_position,
        progressionStepKg: plan.progression_step_kg,
      },
      performances,
    );
    if (!suggestion) continue;

    await supabase.from("progression_suggestions").insert({
      owner_id: userId,
      exercise_id: exerciseId,
      program_id: block.program_days.program_id,
      block_exercise_id: plan.id,
      suggestion_type: suggestion.type,
      reason_code: suggestion.reasonCode,
      reason_payload: suggestion.reasonPayload,
      // Snapshot of the plan the suggestion was based on, to detect staleness later.
      suggested_payload: {
        ...suggestion.suggestedPayload,
        basis: {
          target_weight_kg: plan.target_weight_kg,
          target_reps_min: plan.target_reps_min,
          target_reps_max: plan.target_reps_max,
          target_band_label: plan.target_band_label,
          target_trx_position: plan.target_trx_position,
        },
      },
    });
  }
}
