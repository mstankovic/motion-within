import "server-only";
import { createClient } from "@/lib/supabase/server";

export const PROGRAM_TREE_SELECT = `
  id, name, description, is_active, source, archived_at, created_at,
  program_days (
    id, title, description, day_index, preferred_weekday, intensity,
    workout_blocks (
      id, block_type, title, rounds, sort_order,
      block_exercises (
        id, exercise_id, sort_order, target_sets, target_reps_min, target_reps_max,
        target_duration_seconds, target_weight_kg, target_band_label, target_trx_position,
        tempo, rest_seconds, progression_step_kg, notes,
        exercises ( id, name_sr, name_en, custom_name, tracking_mode, is_mobility )
      )
    )
  )
`;

export async function listPrograms() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("programs")
    .select("id, name, description, is_active, source, created_at, program_days(count)")
    .is("archived_at", null)
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getProgramTree(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("programs")
    .select(PROGRAM_TREE_SELECT)
    .eq("id", id)
    .order("day_index", { referencedTable: "program_days" })
    .order("sort_order", { referencedTable: "program_days.workout_blocks" })
    .order("sort_order", { referencedTable: "program_days.workout_blocks.block_exercises" })
    .maybeSingle();
  if (error) throw error;
  return data;
}

export type ProgramTree = NonNullable<Awaited<ReturnType<typeof getProgramTree>>>;
export type ProgramDay = ProgramTree["program_days"][number];
export type ProgramBlock = ProgramDay["workout_blocks"][number];
export type ProgramBlockExercise = ProgramBlock["block_exercises"][number];

export async function getActiveProgramDays() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("programs")
    .select("id, name, program_days(id, title, intensity, preferred_weekday, day_index)")
    .eq("is_active", true)
    .order("day_index", { referencedTable: "program_days" })
    .maybeSingle();
  if (error) throw error;
  return data;
}
