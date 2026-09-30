"use client";

import { useActionState, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, ChevronLeft, ClipboardPaste, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Label } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { FormMessage } from "@/components/app/form-message";
import { keyboardHeight, useKeyboardInset } from "@/lib/hooks/use-keyboard-inset";
import { extractCode, OTP_LENGTH } from "@/lib/validation/auth";
import { requestOtp, verifyOtp, type AuthState } from "./actions";
import { PasskeySignInButton, usePasskeySignIn } from "./passkey-ui";

const initial: AuthState = {};
const RESEND_COOLDOWN_S = 60;

/**
 * Passwordless sign-in: email → emailed code. The first sign-in creates the account.
 * Both steps post straight to server actions, so they also work before the page's JavaScript
 * has loaded (slow network): the server renders the next step.
 */
export function LoginForm({ next, linkError }: { next?: string; linkError?: boolean }) {
  useKeyboardInset();
  const [sent, sendAction, sending] = useActionState(requestOtp, initial, "/login");
  // "Change email" hides the code step for this particular send.
  const [dismissed, setDismissed] = useState<AuthState | null>(null);
  const [email, setEmail] = useState("");

  if (sent.sentTo && sent !== dismissed) {
    const sentTo = sent.sentTo;
    return (
      <CodeStep
        email={sentTo}
        next={next}
        onChangeEmail={() => {
          setEmail(sentTo);
          setDismissed(sent);
        }}
      />
    );
  }
  return (
    <EmailStep
      email={email}
      onEmailChange={setEmail}
      state={sent}
      action={sendAction}
      pending={sending}
      next={next}
      linkError={linkError}
    />
  );
}

function EmailStep({
  email,
  onEmailChange,
  state,
  action,
  pending,
  next,
  linkError,
}: {
  email: string;
  onEmailChange: (email: string) => void;
  state: AuthState;
  action: (formData: FormData) => void;
  pending: boolean;
  next?: string;
  linkError?: boolean;
}) {
  const t = useTranslations("auth");
  const tp = useTranslations("passkey");
  const passkey = usePasskeySignIn(next);
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
      <form action={action} className="space-y-3" data-keep-visible>
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
                // Controlled so the address survives React's form reset after an action.
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                className="h-14 pl-11"
                required
              />
            </div>
          )}
        </Field>
        <Button type="submit" size="lg" loading={pending}>
          {pending ? (
            t("sending")
          ) : (
            <>
              {t("continue")}
              <ArrowRight aria-hidden="true" />
            </>
          )}
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

  const [state, action, pending] = useActionState(verifyOtp, initial, "/login");
  // A wrong or expired code clears the boxes (adjusting state during render, not in an effect).
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.error) setCode("");
  }
  useEffect(() => {
    if (state.error) inputRef.current?.focus();
  }, [state]);

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

  // Submit as soon as the full code is typed, pasted or autofilled — after React has written it
  // into the input, otherwise the form's own validation still sees the old value.
  const submitWhenComplete = useRef(false);
  useEffect(() => {
    if (submitWhenComplete.current && code.length === OTP_LENGTH) {
      submitWhenComplete.current = false;
      formRef.current?.requestSubmit();
    }
  }, [code]);

  function onCodeChange(value: string) {
    // Typing adds one digit at a time; pasted or autofilled text may be a whole sentence.
    const digits = extractCode(value) ?? value.replace(/\D/g, "").slice(0, OTP_LENGTH);
    setCode(digits);
    submitWhenComplete.current = digits.length === OTP_LENGTH && !pending;
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
      <form ref={formRef} action={action} className="space-y-4" data-keep-visible>
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
        <PasteCodeButton onCode={onCodeChange} />
        {/* Not disabled while incomplete: the input's pattern blocks that, and a disabled button
            would never work before the page's JavaScript loads. */}
        <Button type="submit" size="lg" loading={pending}>
          {pending ? t("checking") : t("signIn")}
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
        onPointerDown={(e) => {
          // Focused on arrival (autoFocus) but iOS did not open the keyboard for it. A tap on an
          // already focused field then opens the keyboard without scrolling the field into view;
          // dropping focus first makes the tap a real focus, which iOS scrolls for.
          if (document.activeElement === e.currentTarget && !keyboardHeight()) {
            e.currentTarget.blur();
          }
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern={`\\d{${OTP_LENGTH}}`}
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

const noop = () => () => {};

/**
 * One tap to use a code copied from the email (e.g. Gmail's "Copy code"). Needs the async
 * clipboard API, which browsers offer only on HTTPS (and localhost); long-press paste into the
 * boxes works everywhere.
 */
function PasteCodeButton({ onCode }: { onCode: (code: string) => void }) {
  const t = useTranslations("auth");
  const supported = useSyncExternalStore(
    noop,
    () => window.isSecureContext && typeof navigator.clipboard?.readText === "function",
    () => false,
  );
  const [message, setMessage] = useState<string | null>(null);
  if (!supported) return null;

  async function paste() {
    setMessage(null);
    try {
      const code = extractCode(await navigator.clipboard.readText());
      if (code) onCode(code);
      else setMessage(t("pasteNoCode"));
    } catch {
      // Permission refused or dismissed: nothing to do, the boxes still accept a long-press paste.
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <Button variant="ghost" size="sm" onClick={paste}>
        <ClipboardPaste aria-hidden="true" />
        {t("pasteCode")}
      </Button>
      <p role="status" className="text-ink-muted text-sm">
        {message}
      </p>
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
