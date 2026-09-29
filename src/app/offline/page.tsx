import { getTranslations } from "next-intl/server";
import { WifiOff } from "lucide-react";
import { BrandMark } from "@/components/app/brand-mark";

export const dynamic = "force-static";

export default async function OfflinePage() {
  const t = await getTranslations("pwa");
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <BrandMark className="size-14" />
      <WifiOff aria-hidden="true" className="text-ink-muted size-8" />
      <h1 className="text-2xl font-extrabold">{t("offlineTitle")}</h1>
      <p className="text-ink-muted">{t("offlineBody")}</p>
    </main>
  );
}
