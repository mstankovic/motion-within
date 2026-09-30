"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient, requireUserId } from "@/lib/supabase/server";
import { isoDateSchema, timeSchema } from "@/lib/validation/calendar";

export type Result = { ok: true; count?: number } | { ok: false; error: string };

function refresh() {
  revalidatePath("/calendar", "layout");
  revalidatePath("/today");
  revalidatePath("/progress");
}

export async function planWeek(weekStart: string): Promise<Result> {
  if (!isoDateSchema.safeParse(weekStart).success) return { ok: false, error: "validation" };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("plan_week", { p_week_start: weekStart });
  if (error) return { ok: false, error: "generic" };
  refresh();
  return { ok: true, count: data ?? 0 };
}

export async function addScheduledWorkout(
  date: string,
  programDayId: string,
  time: string | null,
): Promise<Result> {
  const parsed = z
    .object({ date: isoDateSchema, programDayId: z.uuid(), time: timeSchema })
    .safeParse({ date, programDayId, time });
  if (!parsed.success) return { ok: false, error: "validation" };
  const userId = await requireUserId();
  const supabase = await createClient();
  const { data: day } = await supabase
    .from("program_days")
    .select("title")
    .eq("id", programDayId)
    .maybeSingle();
  if (!day) return { ok: false, error: "validation" };
  const { error } = await supabase.from("scheduled_workouts").insert({
    owner_id: userId,
    program_day_id: programDayId,
    planned_date: parsed.data.date,
    planned_time: parsed.data.time,
    title: day.title,
  });
  if (error) return { ok: false, error: "generic" };
  refresh();
  return { ok: true };
}

export async function rescheduleWorkout(
  id: string,
  date: string,
  time: string | null,
): Promise<Result> {
  const parsed = z.object({ date: isoDateSchema, time: timeSchema }).safeParse({ date, time });
  if (!parsed.success) return { ok: false, error: "validation" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("scheduled_workouts")
    .update({ planned_date: parsed.data.date, planned_time: parsed.data.time, reminder_at: null })
    .eq("id", id)
    .in("status", ["planned", "skipped"]);
  if (error) return { ok: false, error: "generic" };
  refresh();
  return { ok: true };
}

export async function setSkipped(id: string, skipped: boolean): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("scheduled_workouts")
    .update({ status: skipped ? "skipped" : "planned" })
    .eq("id", id)
    .in("status", skipped ? ["planned"] : ["skipped"]);
  if (error) return { ok: false, error: "generic" };
  refresh();
  return { ok: true };
}

export async function removeScheduledWorkout(id: string): Promise<Result> {
  const supabase = await createClient();
  // Workouts with a session are history and stay.
  const { error } = await supabase
    .from("scheduled_workouts")
    .delete()
    .eq("id", id)
    .in("status", ["planned", "skipped"]);
  if (error) return { ok: false, error: "generic" };
  refresh();
  return { ok: true };
}
