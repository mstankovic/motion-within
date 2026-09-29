import { formatNumber } from "@/lib/dates";
import type { PersonalRecord } from "./records";

type RecordKey =
  | "recordKinds.weight"
  | "recordKinds.reps"
  | "recordKinds.duration"
  | "recordKinds.band"
  | "recordKinds.trx";
type T = (key: RecordKey, values: Record<string, string | number>) => string;

/** Record text with its context (weight, band or TRX position). */
export function formatRecord(record: PersonalRecord, t: T, locale: string): string {
  switch (record.kind) {
    case "weight":
      return t("recordKinds.weight", {
        weight: formatNumber(record.weightKg, locale, 2),
        reps: record.reps,
      });
    case "reps":
      return t("recordKinds.reps", { reps: record.reps });
    case "duration":
      return t("recordKinds.duration", { seconds: record.seconds });
    case "band":
      return t("recordKinds.band", { reps: record.reps, band: record.band });
    case "trx":
      return t("recordKinds.trx", { reps: record.reps, position: record.position });
  }
}
