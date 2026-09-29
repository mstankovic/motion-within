import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { IsoDate } from "@/lib/dates";

export type CalendarWorkout = {
  id: string;
  planned_date: string;
  planned_time: string | null;
  title: string;
  status: "planned" | "in_progress" | "completed" | "skipped";
  program_day_id: string | null;
  intensity: "light" | "strong" | "mobility" | "custom" | null;
  exerciseCount: number | null;
  sessionId: string | null;
};

export async function getWorkoutsInRange(from: IsoDate, to: IsoDate): Promise<CalendarWorkout[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scheduled_workouts")
    .select(
      "id, planned_date, planned_time, title, status, program_day_id, program_days(intensity, workout_blocks(block_exercises(count))), workout_sessions(id, status)",
    )
    .gte("planned_date", from)
    .lte("planned_date", to)
    .order("planned_date")
    .order("planned_time", { nullsFirst: false })
    .order("created_at");
  if (error) throw error;

  return data.map((w) => {
    const day = w.program_days;
    const count = day
      ? day.workout_blocks.reduce((sum, b) => sum + (b.block_exercises[0]?.count ?? 0), 0)
      : null;
    const session = w.workout_sessions.find((s) => s.status !== "abandoned");
    return {
      id: w.id,
      planned_date: w.planned_date,
      planned_time: w.planned_time,
      title: w.title,
      status: w.status,
      program_day_id: w.program_day_id,
      intensity: day?.intensity ?? null,
      exerciseCount: count,
      sessionId: session?.id ?? null,
    };
  });
}

export async function getLastCompletedAt(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workout_sessions")
    .select("completed_at")
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.completed_at ?? null;
}

export async function getOpenSession() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workout_sessions")
    .select("id, title_snapshot, started_at")
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

/** Day with the most important workout first: in progress, planned, then the rest. */
export function pickTodayWorkout(workouts: CalendarWorkout[]): CalendarWorkout | null {
  const rank = { in_progress: 0, planned: 1, completed: 2, skipped: 3 } as const;
  return [...workouts].sort((a, b) => rank[a.status] - rank[b.status])[0] ?? null;
}
