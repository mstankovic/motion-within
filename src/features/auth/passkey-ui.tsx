"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { FingerprintPattern, KeyRound, X } from "lucide-react";
import type { PasskeyListItem } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Notice, Skeleton } from "@/components/ui/states";
import { createClient } from "@/lib/supabase/client";
import { completePasskeySignIn } from "./actions";
import {
  classifyPasskeyError,
  detectPasskeySupport,
  deviceName,
  readPasskeyState,
  writePasskeyState,
  type PasskeyDeviceState,
  type PasskeyErrorKind,
  type PasskeySupport,
} from "./passkey";

function usePasskeySupport() {
  const [support, setSupport] = useState<PasskeySupport | null>(null);
  const [deviceState, setDeviceState] = useState<PasskeyDeviceState | null>(null);
  useEffect(() => {
    let active = true;
    detectPasskeySupport().then((s) => {
      if (!active) return;
      setSupport(s);
      setDeviceState(readPasskeyState());
    });
    return () => {
      active = false;
    };
  }, []);
  const update = useCallback((state: PasskeyDeviceState | null) => {
    writePasskeyState(state);
    setDeviceState(state);
  }, []);
  return { support, deviceState, setDeviceState: update };
}

/** Creates a passkey for the signed-in user on this device and names it after the device. */
async function registerThisDevice(): Promise<"ok" | PasskeyErrorKind> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.registerPasskey();
  if (error || !data) return classifyPasskeyError(error);
  // A nicer label than "Passkey" in the list; not critical if it fails.
  await supabase.auth.passkey
    .update({ passkeyId: data.id, friendlyName: deviceName(navigator.userAgent) })
    .catch(() => undefined);
  return "ok";
}

/**
 * Passkey sign-in on the login screen: a "Quick sign-in" button on devices where a passkey was
 * set up, plus passkey suggestions in the email field's autofill (Conditional UI) everywhere.
 */
export function usePasskeySignIn(next?: string) {
  const { support, deviceState } = usePasskeySupport();
  const [error, setError] = useState<"passkeyFailed" | null>(null);
  const [pending, startTransition] = useTransition();

  const run = useCallback(
    async (mediation?: "conditional", signal?: AbortSignal) => {
      const supabase = createClient();
      for (;;) {
        const { data, error } = await supabase.auth.signInWithPasskey({
          options: { mediation, signal },
        });
        if (!error && data?.session) break;
        const kind = classifyPasskeyError(error);
        // A long-open autofill prompt outlives its challenge: fetch a fresh one.
        if (kind === "expired" && mediation === "conditional" && !signal?.aborted) continue;
        // Background autofill fails quietly (e.g. no passkey on this device); only a tap reports.
        if (!mediation && (kind === "failed" || kind === "expired")) setError("passkeyFailed");
        return;
      }
      setError(null);
      startTransition(async () => {
        await completePasskeySignIn(next ?? null);
      });
    },
    [next],
  );

  /** A passkey was created on this device: offer the button. */
  const showButton = Boolean(support?.platform && deviceState === "registered");

  // Elsewhere (e.g. a passkey synced from another device) suggest it in the email field's
  // autofill. Only one WebAuthn request may be open, so this is skipped when the button shows.
  useEffect(() => {
    if (!support?.autofill || showButton) return;
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state changes only after the prompt resolves
    void run("conditional", controller.signal);
    return () => controller.abort();
  }, [support?.autofill, showButton, run]);

  const signInWithButton = useCallback(() => void run(), [run]);

  return {
    showButton,
    signInWithButton,
    pending,
    error,
  };
}

export function PasskeySignInButton({
  onClick,
  pending,
}: {
  onClick: () => void;
  pending: boolean;
}) {
  const t = useTranslations("passkey");
  return (
    <>
      <Button
        variant="secondary"
        size="lg"
        onClick={onClick}
        disabled={pending}
        aria-busy={pending}
      >
        <FingerprintPattern aria-hidden="true" />
        {t("signInButton")}
      </Button>
      <div className="text-ink-subtle my-4 flex items-center gap-3 text-xs font-semibold uppercase">
        <span className="bg-border h-px flex-1" />
        {t("or")}
        <span className="bg-border h-px flex-1" />
      </div>
    </>
  );
}

/** One-time offer (per device) after sign-in to set up a passkey. */
export function PasskeyOffer({ className }: { className?: string }) {
  const t = useTranslations("passkey");
  const { support, deviceState, setDeviceState } = usePasskeySupport();
  const [status, setStatus] = useState<"idle" | "busy" | "done" | "failed">("idle");

  if (status === "done") {
    return (
      <Notice tone="success" className={className}>
        {t("enabled")}
      </Notice>
    );
  }
  if (!support?.platform || deviceState) return null;

  async function enable() {
    setStatus("busy");
    const result = await registerThisDevice();
    if (result === "ok" || result === "alreadyRegistered") {
      setDeviceState("registered");
      setStatus("done");
    } else {
      setStatus(result === "failed" ? "failed" : "idle");
    }
  }

  return (
    <Card className={`flex items-start gap-3 ${className ?? ""}`}>
      <FingerprintPattern aria-hidden="true" className="text-brand mt-0.5 size-6 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-bold">{t("offerTitle")}</p>
        <p className="text-ink-muted text-sm">{t("offerBody")}</p>
        {status === "failed" ? (
          <p className="text-danger mt-1 text-sm font-semibold">{t("errors.failed")}</p>
        ) : null}
        <div className="mt-3 flex items-center gap-2">
          <Button
            size="sm"
            onClick={enable}
            disabled={status === "busy"}
            aria-busy={status === "busy"}
          >
            {t("enable")}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDeviceState("dismissed")}>
            {t("notNow")}
          </Button>
        </div>
      </div>
    </Card>
  );
}

/** Profile section: list, add and remove passkeys. */
export function PasskeySettings() {
  const t = useTranslations("passkey");
  const format = useFormatter();
  const { support, setDeviceState } = usePasskeySupport();
  const [items, setItems] = useState<PasskeyListItem[] | null>(null);
  const [message, setMessage] = useState<{
    tone: "danger" | "success" | "info";
    text: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await createClient().auth.passkey.list();
    if (error) {
      setMessage({ tone: "danger", text: t("errors.loadFailed") });
      setItems([]);
      return;
    }
    setItems(data);
  }, [t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch from the browser client
    void load();
  }, [load]);

  async function add() {
    setBusy(true);
    setMessage(null);
    const result = await registerThisDevice();
    setBusy(false);
    if (result === "ok") {
      setDeviceState("registered");
      setMessage({ tone: "success", text: t("enabled") });
      await load();
    } else if (result === "alreadyRegistered") {
      setDeviceState("registered");
      setMessage({ tone: "info", text: t("errors.alreadyRegistered") });
    } else if (result === "failed") {
      setMessage({ tone: "danger", text: t("errors.failed") });
    }
  }

  async function remove(id: string) {
    setBusy(true);
    setMessage(null);
    const { error } = await createClient().auth.passkey.delete({ passkeyId: id });
    setBusy(false);
    setConfirming(null);
    if (error) {
      setMessage({ tone: "danger", text: t("errors.failed") });
      return;
    }
    const rest = (items ?? []).filter((p) => p.id !== id);
    setItems(rest);
    // We cannot tell which device a passkey lives on; with none left, stop offering the button.
    if (rest.length === 0) setDeviceState(null);
  }

  const date = (iso: string) => format.dateTime(new Date(iso), { dateStyle: "medium" });

  return (
    <Card className="space-y-3">
      <div className="flex items-start gap-3">
        <FingerprintPattern aria-hidden="true" className="text-brand mt-0.5 size-5 shrink-0" />
        <div>
          <h2 className="font-bold">{t("settingsTitle")}</h2>
          <p className="text-ink-muted text-sm">{t("settingsBody")}</p>
        </div>
      </div>
      <div aria-live="polite">
        {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
      </div>
      {items === null ? (
        <Skeleton className="h-14" />
      ) : items.length === 0 ? (
        <p className="text-ink-muted text-sm">{t("empty")}</p>
      ) : (
        <ul className="divide-border divide-y">
          {items.map((p) => (
            <li key={p.id} className="flex min-h-14 items-center gap-3 py-2">
              <KeyRound aria-hidden="true" className="text-ink-subtle size-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.friendly_name || "Passkey"}</p>
                <p className="text-ink-muted text-xs">
                  {t("addedOn", { date: date(p.created_at) })}
                  {p.last_used_at ? ` · ${t("lastUsed", { date: date(p.last_used_at) })}` : null}
                </p>
              </div>
              {confirming === p.id ? (
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="danger" disabled={busy} onClick={() => remove(p.id)}>
                    {t("confirmRemove")}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={t("cancel")}
                    onClick={() => setConfirming(null)}
                  >
                    <X aria-hidden="true" />
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => setConfirming(p.id)}>
                  {t("remove")}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {support?.platform ? (
        <Button variant="outline" onClick={add} disabled={busy} aria-busy={busy}>
          {t("addDevice")}
        </Button>
      ) : support ? (
        <p className="text-ink-subtle text-xs">{t("unsupported")}</p>
      ) : null}
    </Card>
  );
}
