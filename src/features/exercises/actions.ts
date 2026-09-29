"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { createClient, requireUserId } from "@/lib/supabase/server";
import { exerciseSchema, type ExerciseInput } from "@/lib/validation/exercise";

export type ExerciseActionResult = { ok: true; id: string } | { ok: false; error: string };

async function writeRelations(exerciseId: string, input: ExerciseInput) {
  const supabase = await createClient();
  await supabase.from("exercise_muscles").delete().eq("exercise_id", exerciseId);
  await supabase.from("exercise_equipment").delete().eq("exercise_id", exerciseId);
  const muscles = [
    ...input.primaryMuscles.map((id) => ({
      exercise_id: exerciseId,
      muscle_group_id: id,
      role: "primary" as const,
    })),
    ...input.secondaryMuscles.map((id) => ({
      exercise_id: exerciseId,
      muscle_group_id: id,
      role: "secondary" as const,
    })),
  ];
  if (muscles.length) {
    const { error } = await supabase.from("exercise_muscles").insert(muscles);
    if (error) throw error;
  }
  if (input.equipment.length) {
    const { error } = await supabase
      .from("exercise_equipment")
      .insert(input.equipment.map((id) => ({ exercise_id: exerciseId, equipment_id: id })));
    if (error) throw error;
  }
}

export async function saveExercise(
  id: string | null,
  input: ExerciseInput,
): Promise<ExerciseActionResult> {
  const parsed = exerciseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation" };
  const userId = await requireUserId();
  const supabase = await createClient();
  const values = {
    custom_name: parsed.data.name,
    custom_description: parsed.data.description || null,
    tracking_mode: parsed.data.trackingMode,
    is_mobility: parsed.data.isMobility,
  };

  let exerciseId = id;
  if (exerciseId) {
    const { error } = await supabase
      .from("exercises")
      .update(values)
      .eq("id", exerciseId)
      .eq("owner_id", userId);
    if (error) return { ok: false, error: "generic" };
  } else {
    const { data, error } = await supabase
      .from("exercises")
      .insert({ ...values, owner_id: userId, source: "user" })
      .select("id")
      .single();
    if (error) return { ok: false, error: "generic" };
    exerciseId = data.id;
  }

  try {
    await writeRelations(exerciseId, parsed.data);
  } catch {
    return { ok: false, error: "generic" };
  }
  revalidatePath("/exercises");
  return { ok: true, id: exerciseId };
}

export async function copyExercise(id: string): Promise<ExerciseActionResult> {
  await requireUserId();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("copy_exercise", {
    p_exercise_id: id,
    p_locale: await getLocale(),
  });
  if (error || !data) return { ok: false, error: "generic" };
  revalidatePath("/exercises");
  return { ok: true, id: data };
}

/** User exercises are archived rather than deleted so history stays intact. */
export async function archiveExercise(id: string): Promise<ExerciseActionResult> {
  const userId = await requireUserId();
  const supabase = await createClient();
  const { error } = await supabase
    .from("exercises")
    .update({ is_active: false })
    .eq("id", id)
    .eq("owner_id", userId);
  if (error) return { ok: false, error: "generic" };
  revalidatePath("/exercises");
  return { ok: true, id };
}
