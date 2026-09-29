import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ChevronRight, Plus } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { ExerciseFilters } from "@/features/exercises/exercise-filters";
import {
  exerciseName,
  filterExercises,
  type ExerciseFilters as Filters,
} from "@/features/exercises/model";
import { getReferenceData, listExercises } from "@/features/exercises/queries";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("exercises"))("title") };
}

export default async function ExercisesPage({ searchParams }: PageProps<"/exercises">) {
  const [t, tn, locale, params, list, refs] = await Promise.all([
    getTranslations("exercises"),
    getTranslations("nav"),
    getLocale(),
    searchParams,
    listExercises(),
    getReferenceData(),
  ]);
  const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
  const filters: Filters = {
    q: str(params.q),
    muscle: str(params.muscle),
    equipment: str(params.equipment),
    tracking: str(params.tracking),
    scope: str(params.scope) as Filters["scope"],
  };
  const results = filterExercises(list, filters, locale);

  return (
    <>
      <PageHeader
        title={t("title")}
        backHref="/programs"
        backLabel={tn("programs")}
        action={
          <Button asChild size="sm" variant="secondary">
            <Link href="/exercises/new">
              <Plus aria-hidden="true" />
              {t("new")}
            </Link>
          </Button>
        }
      />
      <ExerciseFilters muscles={refs.muscles} equipment={refs.equipment} />
      <p className="sr-only" role="status">
        {results.length}
      </p>
      {results.length === 0 ? (
        <EmptyState
          title={t("noResults")}
          action={
            <Button asChild variant="outline">
              <Link href="/exercises">{t("clearFilters")}</Link>
            </Button>
          }
        />
      ) : (
        <ul className="divide-border bg-surface divide-y overflow-hidden rounded-[var(--radius-card)] shadow-[var(--shadow-card)]">
          {results.map((ex) => (
            <li key={ex.id}>
              <Link
                href={`/exercises/${ex.id}`}
                className="active:bg-surface-muted flex min-h-14 items-center gap-3 px-4 py-2.5 transition-colors duration-(--dur-fast)"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{exerciseName(ex, locale)}</p>
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    <Badge>{t(`trackingMode.${ex.tracking_mode}`)}</Badge>
                    {ex.is_mobility ? <Badge tone="info">{t("mobility")}</Badge> : null}
                    {ex.source === "user" ? <Badge tone="brand">{t("mine")}</Badge> : null}
                  </div>
                </div>
                <ChevronRight aria-hidden="true" className="text-ink-subtle size-5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
