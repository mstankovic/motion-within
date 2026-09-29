import { getDb } from "./db";
import {
  afterFailure,
  classifyError,
  coalesce,
  nextDue,
  type ApplyOutcome,
  type OutboxEntry,
  type OutboxKind,
} from "./outbox-core";

export async function enqueue(
  sessionId: string,
  kind: OutboxKind,
  entityId: string,
  payload: Record<string, unknown>,
  now = Date.now(),
) {
  const db = getDb();
  await db.transaction("rw", db.outbox, async () => {
    const queue = await db.outbox.where("entityId").equals(entityId).toArray();
    const entry: Omit<OutboxEntry, "seq"> = {
      sessionId,
      kind,
      entityId,
      payload,
      attempts: 0,
      nextAttemptAt: now,
      status: "pending",
      createdAt: now,
    };
    const decision = coalesce(queue, entry);
    if (decision.action === "merge") {
      await db.outbox.update(decision.targetSeq, { payload: decision.payload });
    } else {
      if (decision.removeSeqs.length) await db.outbox.bulkDelete(decision.removeSeqs);
      await db.outbox.add(entry as OutboxEntry);
    }
  });
}

export async function pendingCount(sessionId?: string) {
  const db = getDb();
  const all = sessionId
    ? await db.outbox.where("sessionId").equals(sessionId).toArray()
    : await db.outbox.toArray();
  return {
    pending: all.filter((e) => e.status === "pending" || e.status === "inflight").length,
    failed: all.filter((e) => e.status === "failed").length,
    conflict: all.filter((e) => e.status === "conflict").length,
  };
}

/** Reset failed entries so a manual "retry" re-sends them in their original order. */
export async function retryFailed(sessionId?: string) {
  const db = getDb();
  const coll = sessionId
    ? db.outbox.where("sessionId").equals(sessionId)
    : db.outbox.toCollection();
  await coll
    .filter((e) => e.status === "failed")
    .modify({ status: "pending", attempts: 0, nextAttemptAt: 0 });
}

export async function clearSessionOutbox(sessionId: string) {
  await getDb().outbox.where("sessionId").equals(sessionId).delete();
}

let flushing: Promise<FlushResult> | null = null;

export type FlushResult = { processed: number; blocked: boolean; waitMs: number | null };

/**
 * Replays mutations in order. Stops at the first retryable failure so later
 * mutations never overtake earlier ones. A local change is only removed from the
 * outbox after the server confirmed it.
 */
export function flushOutbox(apply: (entry: OutboxEntry) => Promise<void>): Promise<FlushResult> {
  flushing ??= (async () => {
    const db = getDb();
    let processed = 0;
    try {
      for (;;) {
        const now = Date.now();
        const queue = await db.outbox.toArray();
        const head = nextDue(queue, now);
        if (!head) {
          const waiting = queue
            .filter((e) => e.status === "pending")
            .sort((a, b) => a.seq! - b.seq!)[0];
          return {
            processed,
            blocked: Boolean(waiting),
            waitMs: waiting ? Math.max(0, waiting.nextAttemptAt - now) : null,
          };
        }
        await db.outbox.update(head.seq!, { status: "inflight" });
        let outcome: ApplyOutcome = "ok";
        let message: string | undefined;
        try {
          await apply(head);
        } catch (error) {
          outcome = classifyError(error);
          message = (error as Error)?.message;
        }
        if (outcome === "ok") {
          await db.outbox.delete(head.seq!);
          processed++;
          continue;
        }
        const updated = afterFailure({ ...head, status: "inflight" }, outcome, Date.now(), message);
        await db.outbox.put(updated);
        if (outcome === "retry" && updated.status === "pending") {
          return { processed, blocked: true, waitMs: updated.nextAttemptAt - Date.now() };
        }
      }
    } finally {
      flushing = null;
    }
  })();
  return flushing;
}

/** Recover entries left "inflight" by a closed tab. */
export async function resetInflight() {
  await getDb().outbox.where("status").equals("inflight").modify({ status: "pending" });
}
