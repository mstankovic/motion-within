import { describe, expect, it } from "vitest";
import { extractCode, otpSchema, verifyOtpSchema } from "./auth";

describe("otpSchema", () => {
  it("accepts a six-digit code", () => {
    expect(otpSchema.parse("012345")).toBe("012345");
  });

  it("strips spaces and dashes from pasted codes", () => {
    expect(otpSchema.parse(" 123 456 ")).toBe("123456");
    expect(otpSchema.parse("123-456")).toBe("123456");
  });

  it("rejects wrong length or non-digits", () => {
    expect(otpSchema.safeParse("12345").success).toBe(false);
    expect(otpSchema.safeParse("1234567").success).toBe(false);
    expect(otpSchema.safeParse("12a456").success).toBe(false);
  });
});

describe("verifyOtpSchema", () => {
  it("requires a valid email", () => {
    expect(verifyOtpSchema.safeParse({ email: "nope", token: "123456" }).success).toBe(false);
    expect(verifyOtpSchema.safeParse({ email: "a@b.co", token: "123456" }).success).toBe(true);
  });
});

describe("extractCode", () => {
  it.each([
    ["926648", "926648"],
    [" 926648\n", "926648"],
    ["926 648", "926648"],
    ["926-648", "926648"],
    ["Your Motion Within code: 926648", "926648"],
    ["Tvoj kod za prijavu: 012345. Važi 15 minuta.", "012345"],
  ])("finds the code in %j", (text, code) => {
    expect(extractCode(text)).toBe(code);
  });

  it("ignores text without a six-digit code", () => {
    expect(extractCode("hello")).toBeNull();
    expect(extractCode("12345")).toBeNull();
    expect(extractCode("+381641234567")).toBeNull();
  });
});
