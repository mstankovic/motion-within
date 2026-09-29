import { z } from "zod";
import { isRepsRangeValid } from "@/features/workout-session/plan";

const optionalInt = (max: number) => z.number().int().min(0).max(max).nullable();
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((v) => (v ? v : null));

export const programDetailsSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: optionalText(2000),
});

export const dayInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  intensity: z.enum(["light", "strong", "mobility", "custom"]),
  preferredWeekday: z.number().int().min(1).max(7).nullable(),
  description: optionalText(2000).optional(),
});

export const blockInputSchema = z.object({
  blockType: z.enum(["single", "superset", "circuit"]),
  title: optionalText(120),
  rounds: z.number().int().min(1).max(20),
});

export const targetsSchema = z
  .object({
    targetSets: z.number().int().min(1).max(20),
    targetRepsMin: optionalInt(1000),
    targetRepsMax: optionalInt(1000),
    targetDurationSeconds: optionalInt(86400),
    targetWeightKg: z.number().min(0).max(1000).nullable(),
    targetBandLabel: optionalText(60),
    targetTrxPosition: optionalText(60),
    tempo: optionalText(20),
    restSeconds: optionalInt(3600),
    progressionStepKg: z.number().positive().max(100).nullable(),
    notes: optionalText(1000),
  })
  .refine((v) => isRepsRangeValid({ min: v.targetRepsMin, max: v.targetRepsMax }), {
    path: ["targetRepsMax"],
    message: "repsRange",
  });

export type TargetsInput = z.input<typeof targetsSchema>;
