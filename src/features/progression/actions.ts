"use server";

import { revalidatePath } from "next/cache";
import { createClient, requireUserId } from "@/lib/supabase/server";
import type { SuggestionType } from "./engine";
import { acceptPatch, isStale, type PlanSnapshot } from "./apply";

export type SuggestionResult =
  { ok: true } | { ok: false; error: "stale" | "needs_value" | "generic" };

const SNOOZE_DAYS = 21;

function refresh() {
  revalidatePath("/progress", "layout");
  revalidatePath("/sessions", "layout");
  revalidatePath("/programs", "layout");
}

export async function acceptSuggestion(
  id: string,
  edited?: string | number | null,
): Promise<SuggestionResult> {
  await requireUserId();
  const supabase = await createClient();
  const { data: s } = await supabase
    .from("progression_suggestions")
    .select("id, status, suggestion_type, suggested_payload, block_exercise_id")
    .eq("id", id)
    .maybeSingle();
  if (!s || s.status !== "pending") return { ok: false, error: "generic" };

  const payload = (s.suggested_payload ?? {}) as Record<string, unknown> & {
    basis?: Partial<PlanSnapshot>;
  };
  const patch = acceptPatch(s.suggestion_type as SuggestionType, payload, edited);
  if (patch === "needs_value") return { ok: false, error: "needs_value" };

  if (patch) {
    const { data: current } = s.block_exercise_id
      ? await supabase
          .from("block_exercises")
          .select(
            "target_weight_kg, target_reps_min, target_reps_max, target_band_label, target_trx_position",
          )
          .eq("id", s.block_exercise_id)
          .maybeSingle()
      : { data: null };
    if (isStale(payload.basis, current)) {
      await supabase
        .from("progression_suggestions")
        .update({ status: "dismissed", resolved_at: new Date().toISOString() })
        .eq("id", id);
      refresh();
      return { ok: false, error: "stale" };
    }
    const { error } = await supabase
      .from("block_exercises")
      .update(patch)
      .eq("id", s.block_exercise_id!);
    if (error) return { ok: false, error: "generic" };
  }

  const editedValue = edited != null && edited !== "";
  await supabase
    .from("progression_suggestions")
    .update({ status: editedValue ? "edited" : "accepted", resolved_at: new Date().toISOString() })
    .eq("id", id);
  refresh();
  return { ok: true };
}

export async function dismissSuggestion(id: string, snooze = false): Promise<SuggestionResult> {
  await requireUserId();
  const supabase = await createClient();
  const now = new Date();
  const { error } = await supabase
    .from("progression_suggestions")
    .update({
      status: snooze ? "snoozed" : "dismissed",
      resolved_at: now.toISOString(),
      snoozed_until: snooze
        ? new Date(now.getTime() + SNOOZE_DAYS * 86_400_000).toISOString()
        : null,
    })
    .eq("id", id)
    .eq("status", "pending");
  if (error) return { ok: false, error: "generic" };
  refresh();
  return { ok: true };
}
