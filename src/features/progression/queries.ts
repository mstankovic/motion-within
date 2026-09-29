import "server-only";
import { createClient } from "@/lib/supabase/server";
import { exerciseName } from "@/features/exercises/model";
import type { SuggestionView } from "./suggestion-card";
import type { ReasonCode, SuggestionType } from "./engine";

export async function getPendingSuggestions(
  locale: string,
  exerciseIds?: string[],
): Promise<SuggestionView[]> {
  const supabase = await createClient();
  let query = supabase
    .from("progression_suggestions")
    .select(
      "id, exercise_id, suggestion_type, reason_code, reason_payload, suggested_payload, exercises(name_sr, name_en, custom_name)",
    )
    .eq("status", "pending")
    .order("generated_at", { ascending: false })
    .limit(20);
  if (exerciseIds) query = query.in("exercise_id", exerciseIds);
  const { data, error } = await query;
  if (error) throw error;
  return data.map((s) => ({
    id: s.id,
    exerciseName: s.exercises ? exerciseName(s.exercises, locale) : "—",
    type: s.suggestion_type as SuggestionType,
    reasonCode: s.reason_code as ReasonCode,
    reasonPayload: (s.reason_payload ?? {}) as SuggestionView["reasonPayload"],
    suggestedPayload: (s.suggested_payload ?? {}) as SuggestionView["suggestedPayload"],
  }));
}
