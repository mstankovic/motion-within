"use client";

import { createClient } from "@/lib/supabase/client";
import type { OutboxEntry } from "@/lib/offline/outbox-core";

/** Sends one outbox mutation to Supabase. Every operation is idempotent. */
export async function applyMutation(entry: OutboxEntry): Promise<void> {
  const supabase = createClient();
  const p = entry.payload;
  let result: { error: unknown };
  switch (entry.kind) {
    case "set.upsert":
      result = await supabase.from("session_sets").upsert(p as never, { onConflict: "id" });
      break;
    case "set.delete":
      result = await supabase.from("session_sets").delete().eq("id", entry.entityId);
      break;
    case "exercise.update":
      result = await supabase
        .from("session_exercises")
        .update(p as never)
        .eq("id", entry.entityId);
      break;
    case "session.update":
      result = await supabase
        .from("workout_sessions")
        .update(p as never)
        .eq("id", entry.entityId);
      break;
    case "session.complete": {
      // Completing twice is harmless; never move a completed session back.
      result = await supabase
        .from("workout_sessions")
        .update(p as never)
        .eq("id", entry.entityId)
        .in("status", ["in_progress", "completed"]);
      break;
    }
  }
  if (result.error) throw result.error;
}
