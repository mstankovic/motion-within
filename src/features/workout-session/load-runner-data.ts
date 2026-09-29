import "server-only";
import { computeRecords, type PersonalRecord } from "@/features/progress/records";
import { getCompletedSets, getLastPerformances } from "./queries";
import type { LocalSession } from "./types";

/** Previous result and best result for every exercise in a session. */
export async function loadRunnerContext(data: LocalSession) {
  const ids = [
    ...new Set(
      data.exercises.map((e) => e.source_exercise_id).filter((id): id is string => Boolean(id)),
    ),
  ];
  const [last, history] = await Promise.all([
    getLastPerformances(ids, data.session.started_at),
    getCompletedSets(ids),
  ]);
  const bests: Record<string, PersonalRecord[]> = {};
  for (const ex of data.exercises) {
    if (!ex.source_exercise_id) continue;
    const sets = history.filter(
      (h) => h.exercise_id === ex.source_exercise_id && h.session_id !== data.session.id,
    );
    bests[ex.source_exercise_id] = computeRecords(ex.tracking_mode_snapshot, sets);
  }
  return { last, bests, history };
}
