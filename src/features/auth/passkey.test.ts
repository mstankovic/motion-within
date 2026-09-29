import { describe, expect, it } from "vitest";
import { classifyPasskeyError, deviceName } from "./passkey";

describe("classifyPasskeyError", () => {
  it("treats a closed system sheet as a cancel", () => {
    const error = {
      code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
      cause: { name: "NotAllowedError" },
    };
    expect(classifyPasskeyError(error)).toBe("cancelled");
  });

  it("recognizes an aborted ceremony", () => {
    expect(classifyPasskeyError({ code: "ERROR_CEREMONY_ABORTED" })).toBe("aborted");
    expect(classifyPasskeyError({ name: "AbortError" })).toBe("aborted");
  });

  it("recognizes an already registered authenticator", () => {
    expect(classifyPasskeyError({ code: "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED" })).toBe(
      "alreadyRegistered",
    );
  });

  it("recognizes an expired server challenge", () => {
    expect(classifyPasskeyError({ code: "webauthn_challenge_expired" })).toBe("expired");
  });

  it("falls back to failed", () => {
    expect(classifyPasskeyError({ code: "unexpected_failure" })).toBe("failed");
    expect(classifyPasskeyError(null)).toBe("failed");
  });
});

describe("deviceName", () => {
  it.each([
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", "iPhone"],
    ["Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)", "iPad"],
    ["Mozilla/5.0 (Linux; Android 15; Pixel 7)", "Android"],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5)", "Mac"],
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "Windows"],
    ["Mozilla/5.0 (X11; CrOS x86_64 14541.0.0)", "Chromebook"],
    ["curl/8.0", "Passkey"],
  ])("%s → %s", (ua, name) => {
    expect(deviceName(ua)).toBe(name);
  });
});
