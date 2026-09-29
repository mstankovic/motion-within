import { getTranslations } from "next-intl/server";
import { BrandMark } from "@/components/app/brand-mark";

export default async function AuthLayout({ children }: LayoutProps<"/">) {
  const t = await getTranslations("app");
  return (
    <main className="pt-safe mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-8">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <BrandMark className="size-14" />
        <div>
          <p className="text-xl font-extrabold tracking-tight">{t("name")}</p>
          <p className="text-ink-muted text-sm">{t("slogan")}</p>
        </div>
      </div>
      {children}
      <p className="text-ink-subtle mt-auto pt-10 text-center text-xs font-semibold tracking-wide uppercase">
        {t("tagline")}
      </p>
    </main>
  );
}
