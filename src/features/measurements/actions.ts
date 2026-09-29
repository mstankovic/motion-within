"use server";

import { revalidatePath } from "next/cache";
import { createClient, requireUserId } from "@/lib/supabase/server";
import { measurementSchema, type MeasurementInput } from "@/lib/validation/measurement";

export async function saveMeasurement(input: MeasurementInput) {
  const parsed = measurementSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message === "atLeastOne" ? "atLeastOne" : "validation",
    };
  }
  const v = parsed.data;
  const userId = await requireUserId();
  const supabase = await createClient();
  // One entry per day: saving again updates that day.
  const { error } = await supabase.from("body_measurements").upsert(
    {
      owner_id: userId,
      measured_on: v.measuredOn,
      weight_kg: v.weightKg,
      waist_cm: v.waistCm,
      chest_cm: v.chestCm,
      hips_cm: v.hipsCm,
      upper_arm_cm: v.upperArmCm,
      thigh_cm: v.thighCm,
      notes: v.notes || null,
    },
    { onConflict: "owner_id,measured_on" },
  );
  if (error) return { ok: false as const, error: "generic" };
  revalidatePath("/progress", "layout");
  return { ok: true as const };
}

export async function deleteMeasurement(id: string) {
  await requireUserId();
  const supabase = await createClient();
  const { error } = await supabase.from("body_measurements").delete().eq("id", id);
  if (error) return { ok: false as const, error: "generic" };
  revalidatePath("/progress", "layout");
  return { ok: true as const };
}
