"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, requireUserId } from "@/lib/supabase/server";
import { regenerateSuggestions } from "@/features/progression/generate";

export async function startWorkout(scheduledWorkoutId: string) {
  await requireUserId();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("start_session", {
    p_scheduled_workout_id: scheduledWorkoutId,
  });
  if (error || !data) return { ok: false as const, error: error?.message ?? "generic" };
  revalidatePath("/calendar", "layout");
  revalidatePath("/today");
  redirect(`/sessions/${data}`);
}

/** Server-side follow-up once the (possibly offline-queued) completion has synced. */
export async function finalizeSession(sessionId: string) {
  const userId = await requireUserId();
  const supabase = await createClient();
  const { data: session } = await supabase
    .from("workout_sessions")
    .select("id, status")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session || session.status !== "completed")
    return { ok: false as const, error: "not_completed" };
  await regenerateSuggestions(supabase, userId, sessionId);
  revalidatePath("/calendar", "layout");
  revalidatePath("/today");
  revalidatePath("/progress", "layout");
  revalidatePath(`/sessions/${sessionId}`);
  return { ok: true as const };
}

export async function abandonSession(sessionId: string) {
  await requireUserId();
  const supabase = await createClient();
  const { error } = await supabase
    .from("workout_sessions")
    .update({ status: "abandoned" })
    .eq("id", sessionId)
    .eq("status", "in_progress");
  if (error) return { ok: false as const, error: "generic" };
  revalidatePath("/calendar", "layout");
  revalidatePath("/today");
  redirect("/today");
}
