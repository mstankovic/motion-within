import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BookOpen, ChevronRight, Plus } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { ProgramActions, StarterProgramButton } from "@/features/programs/program-actions";
import { listPrograms } from "@/features/programs/queries";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("programs"))("title") };
}

export default async function ProgramsPage() {
  const [t, te, programs] = await Promise.all([
    getTranslations("programs"),
    getTranslations("exercises"),
    listPrograms(),
  ]);
  const active = programs.find((p) => p.is_active);
  const others = programs.filter((p) => !p.is_active);
  const dayCount = (p: (typeof programs)[number]) => p.program_days[0]?.count ?? 0;

  return (
    <>
      <PageHeader
        title={t("title")}
        action={
          <Button asChild size="sm">
            <Link href="/programs/new">
              <Plus aria-hidden="true" />
              {t("new")}
            </Link>
          </Button>
        }
      />

      {programs.length === 0 ? (
        <EmptyState
          title={t("empty")}
          body={t("emptyBody")}
          action={
            <div className="flex flex-col gap-2">
              <StarterProgramButton />
              <Button asChild variant="outline">
                <Link href="/programs/new">{t("new")}</Link>
              </Button>
            </div>
          }
        />
      ) : null}

      {active ? (
        <section className="mb-6" aria-labelledby="active-program">
          <h2
            id="active-program"
            className="text-ink-muted mb-2 text-sm font-bold tracking-wide uppercase"
          >
            {t("activeProgram")}
          </h2>
          <Card className="border-brand border-2">
            <Link href={`/programs/${active.id}`} className="mb-3 flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-bold">{active.name}</p>
                  <Badge tone="success">{t("active")}</Badge>
                  {active.source === "starter" ? (
                    <Badge tone="accent">{t("starterLabel")}</Badge>
                  ) : null}
                </div>
                <p className="text-ink-muted text-sm">{t("days", { count: dayCount(active) })}</p>
              </div>
              <ChevronRight aria-hidden="true" className="text-ink-subtle mt-1 size-5" />
            </Link>
            <ProgramActions id={active.id} name={active.name} isActive />
          </Card>
        </section>
      ) : null}

      {others.length ? (
        <section className="mb-6" aria-labelledby="other-programs">
          <h2
            id="other-programs"
            className="text-ink-muted mb-2 text-sm font-bold tracking-wide uppercase"
          >
            {t("otherPrograms")}
          </h2>
          <ul className="space-y-3">
            {others.map((p) => (
              <li key={p.id}>
                <Card>
                  <Link href={`/programs/${p.id}`} className="mb-3 flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold">{p.name}</p>
                        {p.source === "starter" ? (
                          <Badge tone="accent">{t("starterLabel")}</Badge>
                        ) : null}
                      </div>
                      <p className="text-ink-muted text-sm">{t("days", { count: dayCount(p) })}</p>
                    </div>
                    <ChevronRight aria-hidden="true" className="text-ink-subtle mt-1 size-5" />
                  </Link>
                  <ProgramActions id={p.id} name={p.name} isActive={false} />
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Link
        href="/exercises"
        className="bg-surface active:bg-surface-muted flex min-h-14 items-center gap-3 rounded-[var(--radius-card)] px-4 shadow-[var(--shadow-card)] transition-colors duration-(--dur-fast)"
      >
        <BookOpen aria-hidden="true" className="text-brand size-5" />
        <span className="flex-1 font-semibold">{te("title")}</span>
        <ChevronRight aria-hidden="true" className="text-ink-subtle size-5" />
      </Link>
    </>
  );
}
