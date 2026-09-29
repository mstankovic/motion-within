"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";

export function ErrorView({ reset }: { reset: () => void }) {
  const t = useTranslations("common");
  return (
    <EmptyState
      className="mt-8"
      headingLevel={1}
      title={t("errorTitle")}
      body={t("errorBody")}
      action={
        <div className="flex flex-col gap-2">
          <Button onClick={reset}>
            <RefreshCw aria-hidden="true" />
            {t("retry")}
          </Button>
          <Button asChild variant="ghost">
            <Link href="/calendar">{t("goToCalendar")}</Link>
          </Button>
        </div>
      }
    />
  );
}
