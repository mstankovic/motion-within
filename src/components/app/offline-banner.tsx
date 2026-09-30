"use client";

import { useTranslations } from "next-intl";
import { WifiOff } from "lucide-react";
import { useOnline } from "@/lib/hooks/use-online";

/** Shown above the page content while offline; explains what still works. */
export function OfflineBanner() {
  const t = useTranslations("common");
  const online = useOnline();
  if (online) return null;
  return (
    <div
      role="status"
      className="bg-warning-soft text-warning mb-5.5 flex items-start gap-2.5 rounded-[var(--radius-control)] px-3.5 py-3 text-sm font-semibold"
    >
      <WifiOff aria-hidden="true" className="mt-px size-[1.125rem] shrink-0" strokeWidth={2.2} />
      <span>{t("offlineBanner")}</span>
    </div>
  );
}
