import type { Database } from "@/types/database";

export type TrackingMode = Database["public"]["Enums"]["tracking_mode"];
export type BlockType = Database["public"]["Enums"]["block_type"];
export type SessionExerciseStatus = Database["public"]["Enums"]["session_exercise_status"];

export type SessionRow = Database["public"]["Tables"]["workout_sessions"]["Row"];
export type SessionExerciseRow = Database["public"]["Tables"]["session_exercises"]["Row"];
export type SessionSetRow = Database["public"]["Tables"]["session_sets"]["Row"];

/** Editable fields of a set. Everything else is identity/bookkeeping. */
export type SetValues = Pick<
  SessionSetRow,
  | "reps"
  | "duration_seconds"
  | "weight_kg"
  | "band_label"
  | "trx_position"
  | "rpe"
  | "completed"
  | "notes"
>;

export type LocalSet = Pick<
  SessionSetRow,
  "id" | "session_exercise_id" | "set_number" | "is_warmup"
> &
  SetValues;

export type LocalExercise = SessionExerciseRow & { sets: LocalSet[] };

export type LocalSession = {
  session: SessionRow;
  exercises: LocalExercise[];
};

/** A past performance of an exercise, as returned by the history RPCs. */
export type Performance = {
  session_exercise_id: string;
  session_id: string;
  performed_at: string;
  session_rpe?: number | null;
  status: SessionExerciseStatus;
  pain_flag: boolean;
  sets: Array<
    Pick<
      SessionSetRow,
      | "set_number"
      | "reps"
      | "duration_seconds"
      | "weight_kg"
      | "band_label"
      | "trx_position"
      | "rpe"
      | "completed"
      | "is_warmup"
    >
  >;
};

/** Flat set row used for records and charts. */
export type HistorySet = {
  exercise_id: string;
  session_id: string;
  performed_at: string;
  tracking_mode: TrackingMode;
  reps: number | null;
  duration_seconds: number | null;
  weight_kg: number | null;
  band_label: string | null;
  trx_position: string | null;
  rpe: number | null;
  completed: boolean;
  is_warmup: boolean;
};
