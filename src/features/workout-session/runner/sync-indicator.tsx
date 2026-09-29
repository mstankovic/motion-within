"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, CloudOff, CloudUpload, HardDrive, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SyncState } from "../use-workout-session";

export function SyncIndicator({ state, onRetry }: { state: SyncState; onRetry: () => void }) {
  const t = useTranslations("workout.sync");
  const map = {
    saved: { icon: Check, text: t("saved"), cls: "text-success" },
    local: { icon: HardDrive, text: t("savedLocal"), cls: "text-ink-muted" },
    syncing: { icon: CloudUpload, text: t("syncing"), cls: "text-ink-muted" },
    offline: { icon: CloudOff, text: t("offline"), cls: "text-warning" },
    error: { icon: AlertTriangle, text: t("error"), cls: "text-danger" },
    conflict: { icon: AlertTriangle, text: t("conflict"), cls: "text-danger" },
  } as const;
  const { icon: Icon, text, cls } = map[state];
  return (
    <div className={cn("flex items-center gap-1.5 text-xs font-semibold", cls)}>
      {/* polite + atomic: announced once per change, not on every keystroke */}
      <span
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="flex items-center gap-1.5"
      >
        <Icon aria-hidden="true" className="size-4" />
        {text}
      </span>
      {state === "error" ? (
        <button type="button" onClick={onRetry} className="min-h-8 underline">
          {t("retry")}
        </button>
      ) : null}
    </div>
  );
}
