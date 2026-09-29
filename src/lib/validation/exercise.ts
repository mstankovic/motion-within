import { z } from "zod";

export const trackingModeSchema = z.enum([
  "reps",
  "reps_weight",
  "reps_band",
  "reps_trx",
  "duration",
  "reps_duration",
]);

export const exerciseSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(2000).optional().nullable(),
    trackingMode: trackingModeSchema,
    isMobility: z.boolean(),
    primaryMuscles: z.array(z.uuid()).max(15),
    secondaryMuscles: z.array(z.uuid()).max(15),
    equipment: z.array(z.uuid()).max(10),
  })
  .refine((v) => !v.primaryMuscles.some((m) => v.secondaryMuscles.includes(m)), {
    path: ["secondaryMuscles"],
  });

export type ExerciseInput = z.infer<typeof exerciseSchema>;
