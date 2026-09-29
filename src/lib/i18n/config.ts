export const locales = ["sr", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "sr";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

/**
 * Pick the best supported locale from an Accept-Language header.
 * Serbian and other ex-YU languages written in Latin script map to `sr`.
 */
export function negotiateLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return defaultLocale;
  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag: tag.toLowerCase(), q: q ? Number(q.trim().slice(2)) || 0 : 1 };
    })
    .filter((entry) => entry.tag)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    if (["sr", "hr", "bs", "cnr", "me", "sh"].includes(base)) return "sr";
    if (base === "en") return "en";
  }
  return defaultLocale;
}
