import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ExerciseListItem, RefItem } from "./model";

export async function getReferenceData(): Promise<{ muscles: RefItem[]; equipment: RefItem[] }> {
  const supabase = await createClient();
  const [muscles, equipment] = await Promise.all([
    supabase.from("muscle_groups").select("id, slug, name_sr, name_en").order("slug"),
    supabase.from("equipment").select("id, slug, name_sr, name_en").order("slug"),
  ]);
  if (muscles.error) throw muscles.error;
  if (equipment.error) throw equipment.error;
  return { muscles: muscles.data, equipment: equipment.data };
}

export const EXERCISE_LIST_SELECT =
  "id, owner_id, source, slug, name_sr, name_en, custom_name, tracking_mode, is_mobility, is_active, exercise_muscles(muscle_group_id, role), exercise_equipment(equipment_id)";

type RawListRow = Omit<ExerciseListItem, "muscles" | "equipment"> & {
  exercise_muscles: { muscle_group_id: string; role: "primary" | "secondary" }[];
  exercise_equipment: { equipment_id: string }[];
};

export function toListItem(row: RawListRow): ExerciseListItem {
  const { exercise_muscles, exercise_equipment, ...rest } = row;
  return {
    ...rest,
    muscles: exercise_muscles.map((m) => ({ id: m.muscle_group_id, role: m.role })),
    equipment: exercise_equipment.map((e) => e.equipment_id),
  };
}

export async function listExercises(): Promise<ExerciseListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("exercises").select(EXERCISE_LIST_SELECT);
  if (error) throw error;
  return (data as unknown as RawListRow[]).map(toListItem);
}

export async function getExercise(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercises")
    .select("*, exercise_muscles(muscle_group_id, role), exercise_equipment(equipment_id)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}
