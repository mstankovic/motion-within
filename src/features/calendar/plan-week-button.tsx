"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useServerAction } from "@/lib/hooks/use-server-action";
import { planWeek } from "./actions";

export function PlanWeekButton({ weekStart }: { weekStart: string }) {
  const t = useTranslations("calendar");
  const { run, pending } = useServerAction();
  const [message, setMessage] = useState<string | null>(null);
  return (
    <div>
      <Button
        variant="secondary"
        size="lg"
        disabled={pending}
        onClick={() =>
          run(async () => {
            const result = await planWeek(weekStart);
            if (result.ok) setMessage(t("planWeekDone", { count: result.count ?? 0 }));
            return result;
          })
        }
      >
        <CalendarPlus aria-hidden="true" />
        {t("planWeek")}
      </Button>
      <p role="status" className="text-ink-muted mt-2 text-center text-sm">
        {message}
      </p>
    </div>
  );
}
