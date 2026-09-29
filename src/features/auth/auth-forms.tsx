"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { FormMessage } from "@/components/app/form-message";
import { requestPasswordReset, signIn, signUp, updatePassword, type AuthState } from "./actions";

const initial: AuthState = {};

export function LoginForm({ next, linkError }: { next?: string; linkError?: boolean }) {
  const t = useTranslations("auth");
  const [state, action, pending] = useActionState(signIn, initial);
  const error = state.error ?? (linkError ? "linkInvalid" : undefined);
  return (
    <Card className="p-5">
      <h1 className="text-2xl font-extrabold tracking-tight">{t("loginTitle")}</h1>
      <p className="text-ink-muted mb-5 text-sm">{t("loginSubtitle")}</p>
      <FormMessage error={error ? t(`errors.${error}`) : null} />
      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next ?? ""} />
        <Field label={t("email")}>
          {({ id }) => (
            <Input
              id={id}
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
            />
          )}
        </Field>
        <Field label={t("password")}>
          {({ id }) => (
            <Input
              id={id}
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          )}
        </Field>
        <Button type="submit" size="lg" disabled={pending}>
          {t("signIn")}
        </Button>
      </form>
      <div className="mt-5 flex flex-col items-center gap-2 text-sm">
        <Link href="/forgot-password" className="text-brand font-semibold hover:underline">
          {t("forgotPassword")}
        </Link>
        <p className="text-ink-muted">
          {t("noAccount")}{" "}
          <Link href="/register" className="text-brand font-semibold hover:underline">
            {t("signUp")}
          </Link>
        </p>
      </div>
    </Card>
  );
}

export function RegisterForm() {
  const t = useTranslations("auth");
  const [state, action, pending] = useActionState(signUp, initial);
  return (
    <Card className="p-5">
      <h1 className="text-2xl font-extrabold tracking-tight">{t("registerTitle")}</h1>
      <p className="text-ink-muted mb-5 text-sm">{t("registerSubtitle")}</p>
      <FormMessage
        error={state.error ? t(`errors.${state.error}`) : null}
        success={state.message === "checkEmail" ? t("checkEmail") : null}
      />
      <form action={action} className="space-y-4">
        <Field label={t("displayName")}>
          {({ id }) => <Input id={id} name="displayName" autoComplete="nickname" maxLength={60} />}
        </Field>
        <Field label={t("email")}>
          {({ id }) => (
            <Input
              id={id}
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
            />
          )}
        </Field>
        <Field label={t("password")} hint={t("passwordHint")}>
          {({ id, describedBy }) => (
            <Input
              id={id}
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              aria-describedby={describedBy}
            />
          )}
        </Field>
        <Button type="submit" size="lg" disabled={pending}>
          {t("signUp")}
        </Button>
      </form>
      <p className="text-ink-muted mt-5 text-center text-sm">
        {t("haveAccount")}{" "}
        <Link href="/login" className="text-brand font-semibold hover:underline">
          {t("signIn")}
        </Link>
      </p>
    </Card>
  );
}

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const [state, action, pending] = useActionState(requestPasswordReset, initial);
  return (
    <Card className="p-5">
      <h1 className="text-2xl font-extrabold tracking-tight">{t("forgotTitle")}</h1>
      <p className="text-ink-muted mb-5 text-sm">{t("forgotSubtitle")}</p>
      <FormMessage
        error={state.error ? t(`errors.${state.error}`) : null}
        success={state.message === "resetSent" ? t("resetSent") : null}
      />
      <form action={action} className="space-y-4">
        <Field label={t("email")}>
          {({ id }) => (
            <Input
              id={id}
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
            />
          )}
        </Field>
        <Button type="submit" size="lg" disabled={pending}>
          {t("sendResetLink")}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm">
        <Link href="/login" className="text-brand font-semibold hover:underline">
          {t("signIn")}
        </Link>
      </p>
    </Card>
  );
}

export function ResetPasswordForm() {
  const t = useTranslations("auth");
  const [state, action, pending] = useActionState(updatePassword, initial);
  return (
    <Card className="p-5">
      <h1 className="mb-5 text-2xl font-extrabold tracking-tight">{t("resetTitle")}</h1>
      <FormMessage
        error={state.error ? t(`errors.${state.error}`) : null}
        success={state.message === "passwordUpdated" ? t("passwordUpdated") : null}
      />
      {state.message === "passwordUpdated" ? (
        <Button asChild size="lg">
          <Link href="/calendar">{t("signIn")}</Link>
        </Button>
      ) : (
        <form action={action} className="space-y-4">
          <Field label={t("newPassword")} hint={t("passwordHint")}>
            {({ id, describedBy }) => (
              <Input
                id={id}
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                aria-describedby={describedBy}
              />
            )}
          </Field>
          <Button type="submit" size="lg" disabled={pending}>
            {t("updatePassword")}
          </Button>
        </form>
      )}
    </Card>
  );
}
