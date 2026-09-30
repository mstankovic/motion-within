import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Exercises done in a session (logged in the runner and synced through the outbox). */
export async function getSessionProgress(sessionId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("session_exercises")
    .select("status")
    .eq("session_id", sessionId);
  if (error || !data.length) return null;
  return {
    done: data.filter((e) => e.status !== "pending").length,
    total: data.length,
  };
}
