import { z } from "zod";
import { isIsoDate } from "@/lib/dates";

export const isoDateSchema = z.string().refine(isIsoDate);
export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
  .nullable();
