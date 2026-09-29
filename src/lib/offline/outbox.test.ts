import { beforeEach, describe, expect, it } from "vitest";
import { MotionDB, setDb, getDb } from "./db";
import { enqueue, flushOutbox, pendingCount, retryFailed } from "./outbox";
import { backoffDelay, classifyError, coalesce, nextDue, type OutboxEntry } from "./outbox-core";

let n = 0;
beforeEach(async () => {
  setDb(new MotionDB(`test-${++n}`));
  await getDb().open();
});

describe("outbox core", () => {
  const entry = (
    seq: number,
    kind: OutboxEntry["kind"],
    entityId: string,
    status: OutboxEntry["status"] = "pending",
  ): OutboxEntry => ({
    seq,
    sessionId: "s",
    kind,
    entityId,
    payload: {},
    attempts: 0,
    nextAttemptAt: 0,
    status,
    createdAt: 0,
  });

  it("merges updates of the same row into the pending entry", () => {
    const res = coalesce([entry(1, "set.upsert", "a")], {
      ...entry(0, "set.upsert", "a"),
      payload: { reps: 5 },
    });
    expect(res).toEqual({ action: "merge", targetSeq: 1, payload: { reps: 5 } });
  });

  it("never merges into an in-flight entry", () => {
    const res = coalesce([entry(1, "set.upsert", "a", "inflight")], entry(0, "set.upsert", "a"));
    expect(res.action).toBe("append");
  });

  it("drops pending upserts of a deleted set", () => {
    const res = coalesce(
      [entry(1, "set.upsert", "a"), entry(2, "set.upsert", "b")],
      entry(0, "set.delete", "a"),
    );
    expect(res).toEqual({ action: "append", removeSeqs: [1] });
  });

  it("keeps order: nothing overtakes a head waiting for backoff", () => {
    const q = [
      { ...entry(1, "set.upsert", "a"), nextAttemptAt: 5_000 },
      entry(2, "set.upsert", "b"),
    ];
    expect(nextDue(q, 1_000)).toBeUndefined();
    expect(nextDue(q, 6_000)?.seq).toBe(1);
  });

  it("backs off exponentially with a cap", () => {
    expect(backoffDelay(1)).toBe(1_000);
    expect(backoffDelay(3)).toBe(4_000);
    expect(backoffDelay(20)).toBe(60_000);
  });

  it("classifies errors", () => {
    expect(classifyError(new TypeError("Failed to fetch"))).toBe("retry");
    expect(classifyError({ code: "P0001", message: "session_already_completed" })).toBe("conflict");
    expect(classifyError({ code: "23514", message: "violates check constraint" })).toBe("fatal");
  });
});

describe("outbox with IndexedDB", () => {
  it("replays mutations in order and removes them only after success", async () => {
    await enqueue("s1", "set.upsert", "set-1", { reps: 10 });
    await enqueue("s1", "set.upsert", "set-2", { reps: 8 });
    await enqueue("s1", "set.upsert", "set-1", { rpe: 7 });

    const applied: Array<[string, Record<string, unknown>]> = [];
    const result = await flushOutbox(async (e) => {
      applied.push([e.entityId, e.payload]);
    });

    expect(result.processed).toBe(2);
    expect(applied).toEqual([
      ["set-1", { reps: 10, rpe: 7 }],
      ["set-2", { reps: 8 }],
    ]);
    expect((await pendingCount("s1")).pending).toBe(0);
  });

  it("stops at a network failure and keeps the entry for retry", async () => {
    await enqueue("s1", "set.upsert", "set-1", { reps: 10 });
    await enqueue("s1", "set.upsert", "set-2", { reps: 8 });

    const applied: string[] = [];
    const result = await flushOutbox(async (e) => {
      if (e.entityId === "set-1") throw new TypeError("Failed to fetch");
      applied.push(e.entityId);
    });

    expect(result.blocked).toBe(true);
    expect(applied).toEqual([]);
    const all = await getDb().outbox.orderBy("seq").toArray();
    expect(all.map((e) => [e.entityId, e.status, e.attempts])).toEqual([
      ["set-1", "pending", 1],
      ["set-2", "pending", 0],
    ]);
  });

  it("marks conflicts without blocking other mutations", async () => {
    await enqueue("s1", "session.complete", "s1", { status: "completed" });
    await enqueue("s2", "set.upsert", "x", { reps: 1 });
    const result = await flushOutbox(async (e) => {
      if (e.kind === "session.complete")
        throw { code: "P0001", message: "session_already_completed" };
    });
    expect(result.processed).toBe(1);
    expect(await pendingCount("s1")).toMatchObject({ conflict: 1, pending: 0 });
  });

  it("retries failed entries on demand", async () => {
    await enqueue("s1", "set.upsert", "set-1", { reps: 10 });
    await flushOutbox(async () => {
      throw { code: "23514", message: "check" };
    });
    expect((await pendingCount("s1")).failed).toBe(1);
    await retryFailed("s1");
    expect((await pendingCount("s1")).pending).toBe(1);
  });
});
