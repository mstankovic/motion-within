import { z } from "zod";
import { isoDateSchema } from "./calendar";

const measure = (max: number) => z.number().positive().max(max).nullable();

export const measurementSchema = z
  .object({
    measuredOn: isoDateSchema,
    weightKg: measure(499),
    waistCm: measure(299),
    chestCm: measure(299),
    hipsCm: measure(299),
    upperArmCm: measure(149),
    thighCm: measure(199),
    notes: z.string().trim().max(1000).nullable(),
  })
  .refine(
    (v) =>
      [v.weightKg, v.waistCm, v.chestCm, v.hipsCm, v.upperArmCm, v.thighCm].some((x) => x != null),
    {
      message: "atLeastOne",
    },
  );

export type MeasurementInput = z.input<typeof measurementSchema>;
