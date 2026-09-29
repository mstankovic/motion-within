import "server-only";
import { createClient } from "@/lib/supabase/server";
import { addDays, type IsoDate } from "@/lib/dates";

export async function getProgressOverviewData(today: IsoDate, weeks = 8) {
  const supabase = await createClient();
  const from = addDays(today, -7 * weeks - 7);
  const [sessions, scheduled, performed, weights] = await Promise.all([
    supabase
      .from("workout_sessions")
      .select("started_at, status, session_rpe, energy_after")
      .gte("started_at", `${from}T00:00:00Z`)
      .order("started_at"),
    supabase
      .from("scheduled_workouts")
      .select("planned_date, status")
      .gte("planned_date", from)
      .lte("planned_date", today),
    supabase
      .from("session_exercises")
      .select(
        "source_exercise_id, exercise_name_snapshot, tracking_mode_snapshot, workout_sessions!inner(status, started_at)",
      )
      .eq("workout_sessions.status", "completed")
      .eq("status", "completed")
      .not("source_exercise_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("body_measurements")
      .select("measured_on, weight_kg")
      .not("weight_kg", "is", null)
      .order("measured_on"),
  ]);
  for (const r of [sessions, scheduled, performed, weights]) if (r.error) throw r.error;

  const exercises = new Map<
    string,
    { id: string; name: string; mode: string; count: number; last: string }
  >();
  for (const row of performed.data!) {
    const id = row.source_exercise_id!;
    const existing = exercises.get(id);
    const at = row.workout_sessions.started_at;
    if (existing) {
      existing.count++;
      if (at > existing.last) existing.last = at;
    } else {
      exercises.set(id, {
        id,
        name: row.exercise_name_snapshot,
        mode: row.tracking_mode_snapshot,
        count: 1,
        last: at,
      });
    }
  }

  return {
    sessions: sessions.data!,
    scheduled: scheduled.data!,
    exercises: [...exercises.values()].sort((a, b) => b.last.localeCompare(a.last)),
    weights: weights.data!,
  };
}
