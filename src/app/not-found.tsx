import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";

export default async function NotFound() {
  const t = await getTranslations("common");
  return (
    <main className="mx-auto w-full max-w-xl px-4 pt-16">
      <EmptyState
        headingLevel={1}
        title={t("notFoundTitle")}
        body={t("notFoundBody")}
        action={
          <Button asChild>
            <Link href="/calendar">{t("goToCalendar")}</Link>
          </Button>
        }
      />
    </main>
  );
}
