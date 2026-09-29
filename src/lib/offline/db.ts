import Dexie, { type Table } from "dexie";
import type { LocalSession } from "@/features/workout-session/types";
import type { OutboxEntry } from "./outbox-core";

export type StoredSession = {
  id: string;
  data: LocalSession;
  updatedAt: number;
};

export class MotionDB extends Dexie {
  sessions!: Table<StoredSession, string>;
  outbox!: Table<OutboxEntry, number>;

  constructor(name = "motion-within") {
    super(name);
    this.version(1).stores({
      sessions: "id, updatedAt",
      outbox: "++seq, sessionId, entityId, status",
    });
  }
}

let db: MotionDB | undefined;

export function getDb(): MotionDB {
  db ??= new MotionDB();
  return db;
}

/** Test hook. */
export function setDb(next: MotionDB) {
  db = next;
}
