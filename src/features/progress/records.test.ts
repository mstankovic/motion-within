import { describe, expect, it } from "vitest";
import type { HistorySet, TrackingMode } from "@/features/workout-session/types";
import { chartSeries, compareToLast, computeRecords, newRecordsInSession } from "./records";

function set(
  session: string,
  date: string,
  values: Partial<HistorySet>,
  mode: TrackingMode = "reps_weight",
): HistorySet {
  return {
    exercise_id: "ex",
    session_id: session,
    performed_at: `${date}T10:00:00Z`,
    tracking_mode: mode,
    reps: null,
    duration_seconds: null,
    weight_kg: null,
    band_label: null,
    trx_position: null,
    rpe: null,
    completed: true,
    is_warmup: false,
    ...values,
  };
}

describe("computeRecords", () => {
  it("reps_weight: heaviest weight with at least one rep, ties broken by reps", () => {
    const records = computeRecords("reps_weight", [
      set("a", "2026-09-01", { weight_kg: 20, reps: 5 }),
      set("b", "2026-09-05", { weight_kg: 22.5, reps: 3 }),
      set("c", "2026-09-09", { weight_kg: 22.5, reps: 6 }),
      set("d", "2026-09-10", { weight_kg: 30, reps: 0 }),
    ]);
    expect(records).toEqual([
      expect.objectContaining({ kind: "weight", weightKg: 22.5, reps: 6, sessionId: "c" }),
    ]);
  });

  it("ignores warm-up and incomplete sets", () => {
    const records = computeRecords("reps", [
      set("a", "2026-09-01", { reps: 30, is_warmup: true }, "reps"),
      set("a", "2026-09-01", { reps: 25, completed: false }, "reps"),
      set("a", "2026-09-01", { reps: 12 }, "reps"),
    ]);
    expect(records).toEqual([expect.objectContaining({ kind: "reps", reps: 12 })]);
  });

  it("duration: longest completed duration", () => {
    const records = computeRecords("duration", [
      set("a", "2026-09-01", { duration_seconds: 30 }, "duration"),
      set("b", "2026-09-02", { duration_seconds: 45 }, "duration"),
    ]);
    expect(records).toEqual([expect.objectContaining({ kind: "duration", seconds: 45 })]);
  });

  it("reps_band: best reps per band label, without ranking bands", () => {
    const records = computeRecords("reps_band", [
      set("a", "2026-09-01", { reps: 12, band_label: "Zelena" }, "reps_band"),
      set("b", "2026-09-03", { reps: 14, band_label: "zelena " }, "reps_band"),
      set("b", "2026-09-03", { reps: 8, band_label: "crna" }, "reps_band"),
    ]);
    expect(records).toHaveLength(2);
    expect(records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "band", band: "zelena", reps: 14 }),
        expect.objectContaining({ kind: "band", band: "crna", reps: 8 }),
      ]),
    );
  });

  it("reps_trx: records in the context of the position", () => {
    const records = computeRecords("reps_trx", [
      set("a", "2026-09-01", { reps: 10, trx_position: "srednja" }, "reps_trx"),
      set("a", "2026-09-01", { reps: 7, trx_position: "teška" }, "reps_trx"),
    ]);
    expect(records.map((r) => r.kind === "trx" && r.position).sort()).toEqual(["srednja", "teška"]);
  });
});

describe("newRecordsInSession", () => {
  const history = [
    set("a", "2026-09-01", { weight_kg: 20, reps: 8 }),
    set("b", "2026-09-05", { weight_kg: 22.5, reps: 8 }),
    set("c", "2026-09-09", { weight_kg: 22.5, reps: 8 }),
  ];

  it("reports a record first achieved in the session", () => {
    expect(newRecordsInSession("reps_weight", history, "b")).toHaveLength(1);
  });

  it("does not report a tie as a new record", () => {
    expect(newRecordsInSession("reps_weight", history, "c")).toHaveLength(0);
  });

  it("does not treat the first-ever performance as a record", () => {
    expect(newRecordsInSession("reps_weight", history, "a")).toHaveLength(0);
  });
});

describe("chartSeries", () => {
  it("plots max weight per session in date order", () => {
    const points = chartSeries("reps_weight", [
      set("b", "2026-09-05", { weight_kg: 25, reps: 5 }),
      set("a", "2026-09-01", { weight_kg: 20, reps: 5 }),
      set("a", "2026-09-01", { weight_kg: 22, reps: 3 }),
    ]);
    expect(points.map((p) => p.value)).toEqual([22, 25]);
  });

  it("keeps band context on reps charts", () => {
    const points = chartSeries("reps_band", [
      set("a", "2026-09-01", { reps: 12, band_label: "crvena" }, "reps_band"),
    ]);
    expect(points[0]).toMatchObject({ value: 12, label: "crvena" });
  });
});

describe("compareToLast", () => {
  const s = (over: Partial<HistorySet>) => ({ ...set("x", "2026-09-01", over), completed: true });
  it("compares weight, then reps", () => {
    expect(
      compareToLast(
        "reps_weight",
        [s({ weight_kg: 12.5, reps: 8 })],
        [s({ weight_kg: 10, reps: 12 })],
      ),
    ).toBe("better");
    expect(
      compareToLast(
        "reps_weight",
        [s({ weight_kg: 10, reps: 10 })],
        [s({ weight_kg: 10, reps: 12 })],
      ),
    ).toBe("worse");
    expect(
      compareToLast(
        "reps_weight",
        [s({ weight_kg: 10, reps: 12 })],
        [s({ weight_kg: 10, reps: 12 })],
      ),
    ).toBe("same");
  });
  it("only compares band results with the same band", () => {
    expect(
      compareToLast(
        "reps_band",
        [s({ reps: 12, band_label: "zelena" })],
        [s({ reps: 10, band_label: "Zelena" })],
      ),
    ).toBe("better");
    expect(
      compareToLast(
        "reps_band",
        [s({ reps: 12, band_label: "plava" })],
        [s({ reps: 10, band_label: "zelena" })],
      ),
    ).toBeNull();
  });
  it("returns null without history", () => {
    expect(compareToLast("reps", [s({ reps: 5 })], null)).toBeNull();
  });
});
