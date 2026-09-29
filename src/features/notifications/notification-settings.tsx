"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { BellOff, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { NumberInput } from "@/components/ui/number-input";
import { Notice } from "@/components/ui/states";
import { FormMessage } from "@/components/app/form-message";
import { removeSubscription, savePreferences, saveSubscription } from "./actions";

type Prefs = {
  enabled: boolean;
  minutesBefore: number | null;
  defaultTime: string;
  quietStart: string;
  quietEnd: string;
};

type Support = "checking" | "ok" | "unsupported" | "ios-needs-install" | "denied";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function NotificationSettings({
  initial,
  vapidKey,
}: {
  initial: Prefs;
  vapidKey: string | null;
}) {
  const t = useTranslations("notifications");
  const tc = useTranslations("common");
  const [prefs, setPrefs] = useState(initial);
  const [support, setSupport] = useState<Support>("checking");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ error?: string; success?: string }>({});

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    let next: Support = "ok";
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      next = ios && !standalone ? "ios-needs-install" : "unsupported";
    } else if (Notification.permission === "denied") {
      next = "denied";
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser capability detection
    setSupport(next);
  }, []);

  const toPayload = (p: Prefs) => ({
    enabled: p.enabled,
    minutesBefore: p.minutesBefore ?? 60,
    defaultTime: p.defaultTime.slice(0, 5),
    quietStart: p.quietStart ? p.quietStart.slice(0, 5) : null,
    quietEnd: p.quietEnd ? p.quietEnd.slice(0, 5) : null,
  });

  async function enable() {
    setPending(true);
    setMessage({});
    try {
      // Permission is requested only now, after the user chose to turn reminders on.
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setSupport(permission === "denied" ? "denied" : "ok");
        return;
      }
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
      const sub =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey!),
        }));
      const saved = await saveSubscription(sub.toJSON(), navigator.userAgent);
      if (!saved.ok) throw new Error(saved.error);
      const next = { ...prefs, enabled: true };
      const result = await savePreferences(toPayload(next));
      if (!result.ok) throw new Error(result.error);
      setPrefs(next);
      setMessage({ success: t("enabled") });
    } catch {
      setMessage({ error: t("error") });
    } finally {
      setPending(false);
    }
  }

  async function disable() {
    setPending(true);
    setMessage({});
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const sub = await registration?.pushManager.getSubscription();
      if (sub) {
        await removeSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      const next = { ...prefs, enabled: false };
      await savePreferences(toPayload(next));
      setPrefs(next);
      setMessage({ success: t("disabled") });
    } catch {
      setMessage({ error: tc("errorBody") });
    } finally {
      setPending(false);
    }
  }

  async function saveTimes(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const result = await savePreferences(toPayload(prefs));
    setMessage(result.ok ? { success: t("saved") } : { error: tc("errorBody") });
    setPending(false);
  }

  const canEnable = support === "ok" && Boolean(vapidKey);

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <p className="text-ink-muted text-sm">{t("intro")}</p>
        <FormMessage error={message.error} success={message.success} />
        {!vapidKey ? <Notice tone="warning">{t("notConfigured")}</Notice> : null}
        {support === "unsupported" ? <Notice tone="warning">{t("unsupported")}</Notice> : null}
        {support === "ios-needs-install" ? <Notice>{t("iosInstall")}</Notice> : null}
        {support === "denied" ? <Notice tone="warning">{t("denied")}</Notice> : null}
        {prefs.enabled ? (
          <Button variant="outline" size="lg" disabled={pending} onClick={() => void disable()}>
            <BellOff aria-hidden="true" />
            {t("disable")}
          </Button>
        ) : (
          <Button size="lg" disabled={pending || !canEnable} onClick={() => void enable()}>
            <BellRing aria-hidden="true" />
            {t("enable")}
          </Button>
        )}
      </Card>

      <Card>
        <form className="grid grid-cols-2 gap-3" onSubmit={(e) => void saveTimes(e)}>
          <Field label={t("minutesBefore")}>
            {({ id }) => (
              <NumberInput
                id={id}
                value={prefs.minutesBefore}
                onValueChange={(v) => setPrefs((p) => ({ ...p, minutesBefore: v }))}
              />
            )}
          </Field>
          <Field label={t("defaultTime")}>
            {({ id }) => (
              <Input
                id={id}
                type="time"
                value={prefs.defaultTime.slice(0, 5)}
                onChange={(e) => setPrefs((p) => ({ ...p, defaultTime: e.target.value }))}
                required
              />
            )}
          </Field>
          <Field label={`${t("quietStart")} · ${tc("optional")}`}>
            {({ id }) => (
              <Input
                id={id}
                type="time"
                value={prefs.quietStart.slice(0, 5)}
                onChange={(e) => setPrefs((p) => ({ ...p, quietStart: e.target.value }))}
              />
            )}
          </Field>
          <Field label={`${t("quietEnd")} · ${tc("optional")}`}>
            {({ id }) => (
              <Input
                id={id}
                type="time"
                value={prefs.quietEnd.slice(0, 5)}
                onChange={(e) => setPrefs((p) => ({ ...p, quietEnd: e.target.value }))}
              />
            )}
          </Field>
          <Button type="submit" variant="secondary" className="col-span-2" disabled={pending}>
            {tc("save")}
          </Button>
        </form>
      </Card>
    </div>
  );
}
