"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getDb } from "@/lib/offline/db";
import {
  enqueue,
  flushOutbox,
  pendingCount,
  resetInflight,
  retryFailed,
} from "@/lib/offline/outbox";
import { reduce, type Action } from "./reducer";
import { applyMutation } from "./sync";
import type { LocalSession } from "./types";

export type SyncState = "saved" | "local" | "syncing" | "offline" | "error" | "conflict";

export function useWorkoutSession(initial: LocalSession) {
  const sessionId = initial.session.id;
  const [state, setState] = useState(initial);
  const stateRef = useRef(initial);
  const writes = useRef<Promise<unknown>>(Promise.resolve());
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushRef = useRef<() => Promise<unknown>>(async () => undefined);
  const [sync, setSync] = useState<SyncState>("saved");
  const [ready, setReady] = useState(false);

  const refreshStatus = useCallback(async () => {
    const counts = await pendingCount(sessionId);
    if (counts.conflict) return setSync("conflict");
    if (counts.failed) return setSync("error");
    if (counts.pending) return setSync(navigator.onLine ? "local" : "offline");
    setSync("saved");
  }, [sessionId]);

  const flush = useCallback(async () => {
    if (retryTimer.current) clearTimeout(retryTimer.current);
    await writes.current;
    if (!navigator.onLine) return refreshStatus();
    const { pending } = await pendingCount();
    if (!pending) return refreshStatus();
    setSync("syncing");
    const result = await flushOutbox(applyMutation);
    await refreshStatus();
    if (result.blocked && result.waitMs != null) {
      retryTimer.current = setTimeout(() => void flushRef.current(), Math.max(500, result.waitMs));
    }
    return result;
  }, [refreshStatus]);

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  // Restore: unsynced local edits win over the server copy.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await resetInflight();
        const db = getDb();
        const stored = await db.sessions.get(sessionId);
        const counts = await pendingCount(sessionId);
        const hasLocalChanges = counts.pending + counts.failed + counts.conflict > 0;
        if (stored && hasLocalChanges && !cancelled) {
          stateRef.current = stored.data;
          setState(stored.data);
        } else {
          await db.sessions.put({ id: sessionId, data: initial, updatedAt: Date.now() });
        }
      } catch {
        // IndexedDB unavailable (e.g. private mode): the app still works online.
      }
      if (!cancelled) {
        setReady(true);
        void flush();
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    const online = () => void flush();
    const offline = () => void refreshStatus();
    const visible = () => document.visibilityState === "visible" && void flush();
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    document.addEventListener("visibilitychange", visible);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
      document.removeEventListener("visibilitychange", visible);
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [flush, refreshStatus]);

  const dispatch = useCallback(
    (action: Action) => {
      const { state: next, mutations } = reduce(stateRef.current, action);
      stateRef.current = next;
      setState(next);
      writes.current = writes.current.then(async () => {
        try {
          const db = getDb();
          await db.sessions.put({ id: sessionId, data: next, updatedAt: Date.now() });
          for (const m of mutations) await enqueue(sessionId, m.kind, m.entityId, m.payload);
        } catch {
          // Fall back to direct writes if IndexedDB is unavailable.
          for (const m of mutations) {
            await applyMutation({
              ...m,
              sessionId,
              attempts: 0,
              nextAttemptAt: 0,
              status: "pending",
              createdAt: Date.now(),
            }).catch(() => undefined);
          }
        }
      });
      if (mutations.length) {
        setSync(navigator.onLine ? "local" : "offline");
        void flush();
      }
      return next;
    },
    [sessionId, flush],
  );

  const retry = useCallback(async () => {
    await retryFailed(sessionId);
    await flush();
  }, [sessionId, flush]);

  /** Resolves true once everything for this session reached the server. */
  const waitForSync = useCallback(async () => {
    await flush();
    const counts = await pendingCount(sessionId);
    return counts.pending + counts.failed + counts.conflict === 0;
  }, [flush, sessionId]);

  const forget = useCallback(async () => {
    try {
      await getDb().sessions.delete(sessionId);
    } catch {
      /* ignore */
    }
  }, [sessionId]);

  return { state, dispatch, sync, ready, retry, flush, waitForSync, forget };
}
