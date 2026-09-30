"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient, getProfile, requireUserId } from "@/lib/supabase/server";
import {
  blockInputSchema,
  dayInputSchema,
  programDetailsSchema,
  targetsSchema,
  type TargetsInput,
} from "@/lib/validation/program";
import { startOfWeek, todayInTimeZone } from "@/lib/dates";
import type { z } from "zod";

export type Result = { ok: true } | { ok: false; error: string };

const ok: Result = { ok: true };
const fail = (error = "generic"): Result => ({ ok: false, error });

function refresh(programId?: string) {
  revalidatePath("/programs");
  if (programId) revalidatePath(`/programs/${programId}`);
  revalidatePath("/calendar");
  revalidatePath("/today");
}

// Programs --------------------------------------------------------------------

export async function createProgram(input: z.input<typeof programDetailsSchema>) {
  const parsed = programDetailsSchema.safeParse(input);
  if (!parsed.success) return fail("validation");
  const userId = await requireUserId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("programs")
    .insert({ owner_id: userId, name: parsed.data.name, description: parsed.data.description })
    .select("id")
    .single();
  if (error) return fail();
  refresh();
  redirect(`/programs/${data.id}/edit`);
}

export async function updateProgramDetails(
  id: string,
  input: z.input<typeof programDetailsSchema>,
): Promise<Result> {
  const parsed = programDetailsSchema.safeParse(input);
  if (!parsed.success) return fail("validation");
  const supabase = await createClient();
  const { error } = await supabase.from("programs").update(parsed.data).eq("id", id);
  if (error) return fail();
  refresh(id);
  return ok;
}

export async function activateProgram(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("activate_program", { p_program_id: id });
  if (error) return fail();
  refresh(id);
  return ok;
}

export async function copyProgram(id: string, name: string): Promise<Result> {
  const t = await getTranslations("programs");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("copy_program", {
    p_program_id: id,
    p_name: t("copyOf", { name }).slice(0, 120),
  });
  if (error || !data) return fail();
  refresh();
  redirect(`/programs/${data}`);
}

export async function archiveProgram(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("programs")
    .update({ archived_at: new Date().toISOString(), is_active: false })
    .eq("id", id);
  if (error) return fail();
  refresh();
  redirect("/programs");
}

export async function createStarterProgram(): Promise<Result> {
  const profile = await getProfile();
  const supabase = await createClient();
  const { data: active } = await supabase
    .from("programs")
    .select("id")
    .eq("is_active", true)
    .maybeSingle();
  const { data, error } = await supabase.rpc("create_starter_program", {
    p_weekdays: profile.preferred_weekdays,
    p_activate: !active,
  });
  if (error || !data) return fail();
  if (!active) {
    await supabase.rpc("plan_week", {
      p_week_start: startOfWeek(todayInTimeZone(profile.timezone)),
    });
  }
  refresh();
  redirect(`/programs/${data}`);
}

// Ordering helper ---------------------------------------------------------------

/** Swap an item with its neighbour and renumber siblings 0..n (keeps order dense). */
async function reorder(
  siblingIds: string[],
  id: string,
  direction: -1 | 1,
  write: (id: string, index: number) => PromiseLike<{ error: unknown }>,
): Promise<boolean> {
  const ids = [...siblingIds];
  const index = ids.indexOf(id);
  const target = index + direction;
  if (index < 0) return false;
  if (target < 0 || target >= ids.length) return true;
  [ids[index], ids[target]] = [ids[target], ids[index]];
  for (const [i, siblingId] of ids.entries()) {
    const { error } = await write(siblingId, i);
    if (error) return false;
  }
  return true;
}

// Days ----------------------------------------------------------------------------

export async function addDay(
  programId: string,
  input: z.input<typeof dayInputSchema>,
): Promise<Result> {
  const parsed = dayInputSchema.safeParse(input);
  if (!parsed.success) return fail("validation");
  const supabase = await createClient();
  const { count } = await supabase
    .from("program_days")
    .select("id", { count: "exact", head: true })
    .eq("program_id", programId);
  const { error } = await supabase.from("program_days").insert({
    program_id: programId,
    title: parsed.data.title,
    intensity: parsed.data.intensity,
    preferred_weekday: parsed.data.preferredWeekday,
    day_index: count ?? 0,
  });
  if (error) return fail();
  refresh(programId);
  return ok;
}

export async function updateDay(
  programId: string,
  dayId: string,
  input: z.input<typeof dayInputSchema>,
): Promise<Result> {
  const parsed = dayInputSchema.safeParse(input);
  if (!parsed.success) return fail("validation");
  const supabase = await createClient();
  const { error } = await supabase
    .from("program_days")
    .update({
      title: parsed.data.title,
      intensity: parsed.data.intensity,
      preferred_weekday: parsed.data.preferredWeekday,
    })
    .eq("id", dayId);
  if (error) return fail();
  refresh(programId);
  return ok;
}

export async function deleteDay(programId: string, dayId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("program_days").delete().eq("id", dayId);
  if (error) return fail();
  refresh(programId);
  return ok;
}

export async function moveDay(
  programId: string,
  dayId: string,
  direction: -1 | 1,
): Promise<Result> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("program_days")
    .select("id")
    .eq("program_id", programId)
    .order("day_index");
  const moved = await reorder(
    (data ?? []).map((d) => d.id),
    dayId,
    direction,
    (id, i) => supabase.from("program_days").update({ day_index: i }).eq("id", id),
  );
  if (!moved) return fail();
  refresh(programId);
  return ok;
}

// Blocks ----------------------------------------------------------------------

export async function addBlock(
  programId: string,
  dayId: string,
  blockType: "single" | "superset" | "circuit",
): Promise<Result> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("workout_blocks")
    .select("id", { count: "exact", head: true })
    .eq("program_day_id", dayId);
  const { error } = await supabase.from("workout_blocks").insert({
    program_day_id: dayId,
    block_type: blockType,
    rounds: blockType === "circuit" ? 2 : 1,
    sort_order: count ?? 0,
  });
  if (error) return fail();
  refresh(programId);
  return ok;
}

export async function updateBlock(
  programId: string,
  blockId: string,
  input: z.input<typeof blockInputSchema>,
): Promise<Result> {
  const parsed = blockInputSchema.safeParse(input);
  if (!parsed.success) return fail("validation");
  const supabase = await createClient();
  const { error } = await supabase
    .from("workout_blocks")
    .update({
      block_type: parsed.data.blockType,
      title: parsed.data.title,
      rounds: parsed.data.blockType === "circuit" ? parsed.data.rounds : 1,
    })
    .eq("id", blockId);
  if (error) return fail();
  refresh(programId);
  return ok;
}

export async function deleteBlock(programId: string, blockId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("workout_blocks").delete().eq("id", blockId);
  if (error) return fail();
  refresh(programId);
  return ok;
}

export async function moveBlock(
  programId: string,
  blockId: string,
  direction: -1 | 1,
): Promise<Result> {
  const supabase = await createClient();
  const { data: block } = await supabase
    .from("workout_blocks")
    .select("program_day_id")
    .eq("id", blockId)
    .single();
  if (!block) return fail();
  const { data } = await supabase
    .from("workout_blocks")
    .select("id")
    .eq("program_day_id", block.program_day_id)
    .order("sort_order");
  const moved = await reorder(
    (data ?? []).map((d) => d.id),
    blockId,
    direction,
    (id, i) => supabase.from("workout_blocks").update({ sort_order: i }).eq("id", id),
  );
  if (!moved) return fail();
  refresh(programId);
  return ok;
}

// Block exercises ---------------------------------------------------------------

const DEFAULT_TARGETS: Record<string, Partial<TargetsInput>> = {
  duration: { targetSets: 2, targetDurationSeconds: 30 },
  reps_duration: { targetSets: 2, targetDurationSeconds: 60 },
};

export async function addBlockExercise(
  programId: string,
  blockId: string,
  exerciseId: string,
): Promise<Result> {
  const supabase = await createClient();
  const [{ count }, { data: exercise }] = await Promise.all([
    supabase
      .from("block_exercises")
      .select("id", { count: "exact", head: true })
      .eq("workout_block_id", blockId),
    supabase
      .from("exercises")
      .select("tracking_mode, is_mobility")
      .eq("id", exerciseId)
      .maybeSingle(),
  ]);
  if (!exercise) return fail();
  const defaults = DEFAULT_TARGETS[exercise.tracking_mode] ?? {
    targetSets: 3,
    targetRepsMin: 8,
    targetRepsMax: 12,
  };
  const { error } = await supabase.from("block_exercises").insert({
    workout_block_id: blockId,
    exercise_id: exerciseId,
    sort_order: count ?? 0,
    target_sets: defaults.targetSets ?? 3,
    target_reps_min: defaults.targetRepsMin ?? null,
    target_reps_max: defaults.targetRepsMax ?? null,
    target_duration_seconds: defaults.targetDurationSeconds ?? null,
  });
  if (error) return fail();
  refresh(programId);
  return ok;
}

export async function updateBlockExercise(
  programId: string,
  id: string,
  input: TargetsInput,
): Promise<Result> {
  const parsed = targetsSchema.safeParse(input);
  if (!parsed.success)
    return fail(parsed.error.issues[0]?.message === "repsRange" ? "repsRange" : "validation");
  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("block_exercises")
    .update({
      target_sets: v.targetSets,
      target_reps_min: v.targetRepsMin,
      target_reps_max: v.targetRepsMax,
      target_duration_seconds: v.targetDurationSeconds,
      target_weight_kg: v.targetWeightKg,
      target_band_label: v.targetBandLabel,
      target_trx_position: v.targetTrxPosition,
      tempo: v.tempo,
      rest_seconds: v.restSeconds,
      progression_step_kg: v.progressionStepKg,
      notes: v.notes,
    })
    .eq("id", id);
  if (error) return fail();
  refresh(programId);
  return ok;
}

export async function removeBlockExercise(programId: string, id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("block_exercises").delete().eq("id", id);
  if (error) return fail();
  refresh(programId);
  return ok;
}

export async function moveBlockExercise(
  programId: string,
  id: string,
  direction: -1 | 1,
): Promise<Result> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("block_exercises")
    .select("workout_block_id")
    .eq("id", id)
    .single();
  if (!row) return fail();
  const { data } = await supabase
    .from("block_exercises")
    .select("id")
    .eq("workout_block_id", row.workout_block_id)
    .order("sort_order");
  const moved = await reorder(
    (data ?? []).map((d) => d.id),
    id,
    direction,
    (rowId, i) => supabase.from("block_exercises").update({ sort_order: i }).eq("id", rowId),
  );
  if (!moved) return fail();
  refresh(programId);
  return ok;
}
