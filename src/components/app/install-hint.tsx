"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void> };

/** Shown only when the app is not installed yet. */
export function InstallHint() {
  const t = useTranslations("profile");
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<"hidden" | "prompt" | "ios">("hidden");

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- depends on browser-only APIs
    if (isIos) setMode("ios");
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
      setMode("prompt");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (mode === "hidden") return null;
  return (
    <Card className="flex items-start gap-3">
      <Download aria-hidden="true" className="text-brand mt-0.5 size-5 shrink-0" />
      <div className="flex-1">
        <p className="font-bold">{t("installTitle")}</p>
        <p className="text-ink-muted text-sm">
          {mode === "ios" ? t("installIos") : t("installBody")}
        </p>
        {mode === "prompt" && promptEvent ? (
          <Button
            size="sm"
            className="mt-2"
            onClick={async () => {
              await promptEvent.prompt();
              setMode("hidden");
            }}
          >
            {t("installButton")}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
