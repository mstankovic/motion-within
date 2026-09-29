import { z } from "zod";

export const OTP_LENGTH = 6;

export const emailSchema = z.email().max(254);

/** The emailed sign-in code; tolerates spaces/dashes from copy-paste. */
export const otpSchema = z
  .string()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(new RegExp(`^\\d{${OTP_LENGTH}}$`)));

export const verifyOtpSchema = z.object({
  email: emailSchema,
  token: otpSchema,
});
