"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { FormMessage } from "@/components/app/form-message";
import { createProgram } from "./actions";

export function NewProgramForm() {
  const t = useTranslations("programs");
  const tc = useTranslations("common");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <FormMessage error={error} />
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return setError(t("errors.nameRequired"));
          startTransition(async () => {
            const result = await createProgram({ name, description });
            if (result && !result.ok) setError(tc("errorBody"));
          });
        }}
      >
        <Field label={t("name")}>
          {({ id }) => (
            <Input
              id={id}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              required
            />
          )}
        </Field>
        <Field label={`${t("description")} · ${tc("optional")}`}>
          {({ id }) => (
            <Textarea
              id={id}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
            />
          )}
        </Field>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? tc("saving") : tc("save")}
        </Button>
      </form>
    </Card>
  );
}
