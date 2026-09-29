"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, ChevronLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Label } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { FormMessage } from "@/components/app/form-message";
import { OTP_LENGTH } from "@/lib/validation/auth";
import { requestOtp, verifyOtp, type AuthState } from "./actions";
import { PasskeySignInButton, usePasskeySignIn } from "./passkey-ui";

const initial: AuthState = {};
const RESEND_COOLDOWN_S = 60;

/** Passwordless sign-in: email → emailed code. The first sign-in creates the account. */
export function LoginForm({ next, linkError }: { next?: string; linkError?: boolean }) {
  const [email, setEmail] = useState<string | null>(null);
  const [lastEmail, setLastEmail] = useState("");

  if (email) {
    return (
      <CodeStep
        email={email}
        next={next}
        onChangeEmail={() => {
          setLastEmail(email);
          setEmail(null);
        }}
      />
    );
  }
  return <EmailStep defaultEmail={lastEmail} next={next} linkError={linkError} onSent={setEmail} />;
}

function EmailStep({
  defaultEmail,
  next,
  linkError,
  onSent,
}: {
  defaultEmail: string;
  next?: string;
  linkError?: boolean;
  onSent: (email: string) => void;
}) {
  const t = useTranslations("auth");
  const tp = useTranslations("passkey");
  const passkey = usePasskeySignIn(next);
  // Controlled so the address survives React's form reset after an action (e.g. on an error).
  const [email, setEmail] = useState(defaultEmail);
  const [state, action, pending] = useActionState(async (prev: AuthState, formData: FormData) => {
    const result = await requestOtp(prev, formData);
    if (result.sentTo) onSent(result.sentTo);
    return result;
  }, initial);
  const error = state.error ?? (linkError ? "linkInvalid" : undefined);
  const errorText = error
    ? t(`errors.${error}`)
    : passkey.error
      ? tp(`errors.${passkey.error}`)
      : null;

  return (
    <div className="animate-fade-in" data-step="email">
      <h2 className="mb-4 text-xl font-extrabold tracking-tight">{t("formTitle")}</h2>
      <FormMessage error={errorText} />
      {passkey.showButton ? (
        <PasskeySignInButton onClick={passkey.signInWithButton} pending={passkey.pending} />
      ) : null}
      <form action={action} className="space-y-3">
        <Field label={<span className="sr-only">{t("email")}</span>}>
          {({ id }) => (
            <div className="relative">
              <Mail
                aria-hidden="true"
                className="text-ink-subtle pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2"
              />
              <Input
                id={id}
                name="email"
                type="email"
                // "webauthn" lets the keyboard/autofill suggest saved passkeys.
                autoComplete="username webauthn"
                inputMode="email"
                autoCapitalize="none"
                spellCheck={false}
                placeholder={t("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 pl-11"
                required
              />
            </div>
          )}
        </Field>
        <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
          {t("continue")}
          <ArrowRight aria-hidden="true" />
        </Button>
      </form>
    </div>
  );
}

function CodeStep({
  email,
  next,
  onChangeEmail,
}: {
  email: string;
  next?: string;
  onChangeEmail: () => void;
}) {
  const t = useTranslations("auth");
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");

  const [state, action, pending] = useActionState(async (prev: AuthState, formData: FormData) => {
    const result = await verifyOtp(prev, formData);
    if (result.error) {
      setCode("");
      inputRef.current?.focus();
    }
    return result;
  }, initial);

  const [resendAt, setResendAt] = useState(() => Date.now() + RESEND_COOLDOWN_S * 1000);
  const [resendState, resendAction, resending] = useActionState(
    async (prev: AuthState, formData: FormData) => {
      const result = await requestOtp(prev, formData);
      if (result.sentTo) setResendAt(Date.now() + RESEND_COOLDOWN_S * 1000);
      return result;
    },
    initial,
  );
  const secondsLeft = useSecondsUntil(resendAt);

  function onCodeChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, OTP_LENGTH);
    setCode(digits);
    // Submit as soon as the full code is typed or pasted (iOS/Android autofill included).
    if (digits.length === OTP_LENGTH && !pending) {
      queueMicrotask(() => formRef.current?.requestSubmit());
    }
  }

  const error = state.error ?? resendState.error;

  return (
    <div className="animate-rise" data-step="code">
      <div className="mb-4 flex items-start gap-2">
        <Button
          size="icon"
          variant="ghost"
          className="-ml-3 shrink-0"
          aria-label={t("changeEmail")}
          onClick={onChangeEmail}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <div className="min-w-0 pt-1">
          <h2 className="text-xl font-extrabold tracking-tight">{t("codeTitle")}</h2>
          <p className="text-ink-muted text-sm">
            {t.rich("codeSubtitle", {
              email,
              b: (chunks) => (
                <strong className="text-ink font-semibold [overflow-wrap:anywhere]">
                  {chunks}
                </strong>
              ),
            })}
          </p>
        </div>
      </div>
      <FormMessage
        error={error ? t(`errors.${error}`) : null}
        success={resendState.sentTo && !error ? t("codeResent") : null}
      />
      <form ref={formRef} action={action} className="space-y-4">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="next" value={next ?? ""} />
        <Label htmlFor="otp" className="sr-only">
          {t("code")}
        </Label>
        <CodeBoxes
          ref={inputRef}
          id="otp"
          value={code}
          invalid={Boolean(state.error)}
          onChange={onCodeChange}
        />
        <Button
          type="submit"
          size="lg"
          disabled={pending || code.length !== OTP_LENGTH}
          aria-busy={pending}
        >
          {t("signIn")}
        </Button>
      </form>
      <form action={resendAction} className="mt-3 text-center text-sm">
        <input type="hidden" name="email" value={email} />
        <Button type="submit" variant="link" disabled={resending || secondsLeft > 0}>
          {secondsLeft > 0 ? t("resendIn", { seconds: secondsLeft }) : t("resend")}
        </Button>
      </form>
    </div>
  );
}

/**
 * One real input (keeps paste and iOS/Android code autofill working) drawn as separate digit boxes.
 */
function CodeBoxes({
  ref,
  id,
  value,
  invalid,
  onChange,
}: {
  ref: React.Ref<HTMLInputElement>;
  id: string;
  value: string;
  invalid: boolean;
  onChange: (value: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className={cn("relative", invalid && value === "" && "animate-shake")}>
      <input
        ref={ref}
        id={id}
        name="token"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern={`\\d{${OTP_LENGTH}}`}
        maxLength={OTP_LENGTH + 2}
        aria-invalid={invalid || undefined}
        className="absolute inset-0 z-10 h-full w-full cursor-text text-base opacity-0"
        required
        autoFocus
      />
      <div aria-hidden="true" className="grid grid-cols-6 gap-2">
        {Array.from({ length: OTP_LENGTH }, (_, i) => {
          const active = focused && i === Math.min(value.length, OTP_LENGTH - 1);
          return (
            <div
              key={i}
              className={cn(
                "bg-surface-muted flex h-14 items-center justify-center rounded-[var(--radius-control)] border-2 border-transparent text-2xl font-extrabold tabular-nums transition-[border-color,background-color] duration-(--dur-fast)",
                value[i] && "bg-surface border-border animate-pop",
                active && "border-brand bg-surface",
                invalid && value === "" && "border-danger/60",
              )}
            >
              {value[i] ?? (active ? <span className="bg-brand h-6 w-0.5 animate-pulse" /> : "")}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function useSecondsUntil(target: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (now >= target) return;
    const id = setTimeout(() => setNow(Date.now()), 1000);
    return () => clearTimeout(id);
  }, [now, target]);
  return Math.max(0, Math.ceil((target - now) / 1000));
}
