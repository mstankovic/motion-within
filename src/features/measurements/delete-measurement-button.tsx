"use client";

import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useServerAction } from "@/lib/hooks/use-server-action";
import { deleteMeasurement } from "./actions";

export function DeleteMeasurementButton({ id, label }: { id: string; label: string }) {
  const tc = useTranslations("common");
  const { run, pending } = useServerAction();
  return (
    <Button
      size="icon"
      variant="ghost"
      aria-label={`${tc("delete")}: ${label}`}
      disabled={pending}
      onClick={() => run(() => deleteMeasurement(id))}
    >
      <Trash2 aria-hidden="true" />
    </Button>
  );
}
