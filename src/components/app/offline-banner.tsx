"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { WifiOff } from "lucide-react";

function subscribe(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

export function OfflineBanner() {
  const t = useTranslations("common");
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
  if (online) return null;
  return (
    <div
      role="status"
      className="bg-warning-soft text-warning mb-3 flex items-center gap-2 rounded-[var(--radius-control)] px-3 py-2 text-sm font-semibold"
    >
      <WifiOff aria-hidden="true" className="size-4" />
      {t("offlineBadge")}
    </div>
  );
}
