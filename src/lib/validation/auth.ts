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

/**
 * The sign-in code inside pasted text: "926648", "926 648", "926-648" or a sentence such as
 * "Your code: 926648". Longer digit runs (phone numbers, years with more digits) are ignored.
 */
export function extractCode(text: string): string | null {
  const match = text.match(/(?<!\d)(\d{3})[\s-]?(\d{3})(?!\d)/);
  return match ? match[1] + match[2] : null;
}
