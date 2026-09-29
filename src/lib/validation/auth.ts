import { z } from "zod";

export const emailSchema = z.email().max(254);
export const passwordSchema = z.string().min(8).max(72);

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(72),
});

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z.string().trim().max(60).optional(),
});
