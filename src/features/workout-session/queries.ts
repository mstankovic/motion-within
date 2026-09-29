import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { HistorySet, LocalSession, Performance } from "./types";

export async function getSession(sessionId: string): Promise<LocalSession | null> {
  const supabase = await createClient();
  const { data: session, error } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();
  if (error) throw error;
  if (!session) return null;

  const { data: exercises, error: exError } = await supabase
    .from("session_exercises")
    .select(
      "*, session_sets(id, session_exercise_id, set_number, is_warmup, reps, duration_seconds, weight_kg, band_label, trx_position, rpe, completed, notes)",
    )
    .eq("session_id", sessionId)
    .order("block_sort_order")
    .order("exercise_sort_order")
    .order("set_number", { referencedTable: "session_sets" });
  if (exError) throw exError;

  return {
    session,
    exercises: exercises.map(({ session_sets, ...rest }) => ({ ...rest, sets: session_sets })),
  };
}

export async function getLastPerformances(exerciseIds: string[], before: string) {
  if (!exerciseIds.length) return {} as Record<string, Performance>;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("exercise_last_performances", {
    p_exercise_ids: exerciseIds,
    p_before: before,
  });
  if (error) throw error;
  return (data ?? {}) as unknown as Record<string, Performance>;
}

export async function getCompletedSets(exerciseIds: string[]): Promise<HistorySet[]> {
  if (!exerciseIds.length) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("exercise_completed_sets", {
    p_exercise_ids: exerciseIds,
  });
  if (error) throw error;
  return data as HistorySet[];
}
