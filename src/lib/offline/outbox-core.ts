/**
 * Pure outbox rules (no IndexedDB), so ordering, coalescing and retry policy
 * are unit-testable. Mutations are replayed strictly in `seq` order and every
 * mutation is an idempotent upsert/update/delete keyed by a client-known id.
 */

export type OutboxKind =
  "set.upsert" | "set.delete" | "exercise.update" | "session.update" | "session.complete";

export type OutboxStatus = "pending" | "inflight" | "failed" | "conflict";

export type OutboxEntry = {
  seq?: number;
  sessionId: string;
  kind: OutboxKind;
  /** Row the mutation targets (set / session exercise / session id). */
  entityId: string;
  payload: Record<string, unknown>;
  attempts: number;
  nextAttemptAt: number;
  status: OutboxStatus;
  lastError?: string;
  createdAt: number;
};

export const MAX_ATTEMPTS = 8;
const BASE_DELAY_MS = 1_000;
const MAX_DELAY_MS = 60_000;

export function backoffDelay(attempts: number): number {
  return Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** Math.max(0, attempts - 1));
}

const MERGEABLE: OutboxKind[] = ["set.upsert", "exercise.update", "session.update"];

export type CoalesceResult =
  | { action: "merge"; targetSeq: number; payload: Record<string, unknown> }
  | { action: "append"; removeSeqs: number[] };

/**
 * Decide how a new mutation joins the queue.
 * - Updates to the same row merge into the latest still-pending entry for that
 *   row (never into one already in flight), keeping its queue position.
 * - Deleting a set drops its pending upserts (the delete itself is still sent,
 *   since an earlier upsert may already have reached the server).
 */
export function coalesce(queue: OutboxEntry[], next: Omit<OutboxEntry, "seq">): CoalesceResult {
  const sameEntity = queue
    .filter((e) => e.entityId === next.entityId && e.seq != null)
    .sort((a, b) => a.seq! - b.seq!);

  if (next.kind === "set.delete") {
    return {
      action: "append",
      removeSeqs: sameEntity
        .filter((e) => e.kind === "set.upsert" && e.status === "pending")
        .map((e) => e.seq!),
    };
  }

  if (MERGEABLE.includes(next.kind)) {
    const last = sameEntity.at(-1);
    if (last && last.kind === next.kind && last.status === "pending") {
      return {
        action: "merge",
        targetSeq: last.seq!,
        payload: { ...last.payload, ...next.payload },
      };
    }
  }

  return { action: "append", removeSeqs: [] };
}

/** Next entry to process: lowest seq that is pending and due. Failed/conflict entries are skipped. */
export function nextDue(queue: OutboxEntry[], now: number): OutboxEntry | undefined {
  const ordered = queue
    .filter((e) => e.status === "pending" || e.status === "inflight")
    .sort((a, b) => a.seq! - b.seq!);
  const head = ordered[0];
  // Preserve order: if the head is waiting for its backoff, nothing behind it runs.
  if (!head || head.nextAttemptAt > now) return undefined;
  return head;
}

export type ApplyOutcome = "ok" | "retry" | "conflict" | "fatal";

/** Classify a Supabase/PostgREST or network error. */
export function classifyError(error: unknown): Exclude<ApplyOutcome, "ok"> {
  const e = error as { code?: string; message?: string; status?: number; name?: string } | null;
  const message = e?.message ?? "";
  if (message.includes("session_already_completed")) return "conflict";
  if (e?.name === "TypeError" || /fetch|network|Failed to fetch|Load failed/i.test(message))
    return "retry";
  if (e?.status && (e.status >= 500 || e.status === 408 || e.status === 429 || e.status === 401))
    return "retry";
  if (e?.code === "PGRST301" || e?.code === "PGRST303") return "retry"; // JWT expired/invalid → refresh and retry
  if (!e?.code && !e?.status) return "retry";
  return "fatal";
}

export function afterFailure(
  entry: OutboxEntry,
  outcome: Exclude<ApplyOutcome, "ok">,
  now: number,
  error?: string,
): OutboxEntry {
  if (outcome === "conflict") return { ...entry, status: "conflict", lastError: error };
  if (outcome === "fatal") return { ...entry, status: "failed", lastError: error };
  const attempts = entry.attempts + 1;
  if (attempts >= MAX_ATTEMPTS) return { ...entry, attempts, status: "failed", lastError: error };
  return {
    ...entry,
    attempts,
    status: "pending",
    nextAttemptAt: now + backoffDelay(attempts),
    lastError: error,
  };
}
