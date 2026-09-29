import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { isLocale, LOCALE_COOKIE, negotiateLocale } from "./config";

export default getRequestConfig(async () => {
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale)
    ? cookieLocale
    : negotiateLocale((await headers()).get("accept-language"));

  const messages = (await import(`../../messages/${locale}.json`)).default;
  const fallback = locale === "en" ? messages : (await import("../../messages/en.json")).default;

  return {
    locale,
    messages: deepMerge(fallback, messages),
    timeZone: "Europe/Podgorica",
    // English is used only when a Serbian key is genuinely missing.
    onError(error) {
      if (process.env.NODE_ENV !== "production") console.warn(error.message);
    },
  };
});

type Messages = { [key: string]: string | Messages };

function deepMerge(base: Messages, override: Messages): Messages {
  const out: Messages = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const existing = out[key];
    out[key] =
      typeof value === "object" && typeof existing === "object"
        ? deepMerge(existing, value)
        : value;
  }
  return out;
}
