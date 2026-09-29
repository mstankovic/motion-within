import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import sr from "@/messages/sr.json";
import { negotiateLocale } from "./config";

function keys(obj: object, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === "object" && v !== null ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe("translations", () => {
  it("Serbian and English have exactly the same keys", () => {
    expect(keys(sr).sort()).toEqual(keys(en).sort());
  });

  it("Serbian strings use Latin script only", () => {
    const cyrillic = /[Ѐ-ӿ]/;
    const offenders = keys(sr).filter((k) => {
      const value = k
        .split(".")
        .reduce<unknown>((o, part) => (o as Record<string, unknown>)[part], sr);
      return typeof value === "string" && cyrillic.test(value);
    });
    expect(offenders).toEqual([]);
  });
});

describe("negotiateLocale", () => {
  it("prefers the highest-ranked supported language", () => {
    expect(negotiateLocale("en-US,en;q=0.9,sr;q=0.8")).toBe("en");
    expect(negotiateLocale("sr-Latn-RS,sr;q=0.9")).toBe("sr");
    expect(negotiateLocale("hr-HR,hr;q=0.9,en;q=0.5")).toBe("sr");
    expect(negotiateLocale("de-DE")).toBe("sr");
    expect(negotiateLocale(null)).toBe("sr");
  });
});
