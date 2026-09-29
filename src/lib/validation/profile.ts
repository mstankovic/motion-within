import { z } from "zod";
import { isValidTimeZone } from "@/lib/dates";
import { locales } from "@/lib/i18n/config";

export const GOALS = ["conditioning", "strength", "weight_loss", "mobility"] as const;
export type Goal = (typeof GOALS)[number];

export const weekdaySchema = z.number().int().min(1).max(7);

export const profileSchema = z.object({
  displayName: z.string().trim().max(60).optional().nullable(),
  locale: z.enum(locales),
  timezone: z.string().refine(isValidTimeZone),
  goals: z.array(z.enum(GOALS)).max(GOALS.length),
  preferredWeekdays: z.array(weekdaySchema).max(7),
});

export const onboardingSchema = profileSchema.extend({
  preferredWeekdays: z.array(weekdaySchema).min(1).max(7),
  createStarter: z.boolean(),
  safetyAcknowledged: z.literal(true),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
