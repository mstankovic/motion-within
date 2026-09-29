import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Pencil, Trophy } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { formatRecord } from "@/features/progress/format-record";
import { compareToLast, newRecordsInSession } from "@/features/progress/records";
import { SuggestionCard } from "@/features/progression/suggestion-card";
import { getPendingSuggestions } from "@/features/progression/queries";
import { localDate } from "@/features/progress/stats";
import { formatIsoDate } from "@/lib/dates";
import { formatSetsSummary } from "./format";
import { loadRunnerContext } from "./load-runner-data";
import type { LocalSession } from "./types";

export async function SessionSummary({ data, timeZone }: { data: LocalSession; timeZone: string }) {
  const [t, tp, ts, locale] = await Promise.all([
    getTranslations("workout"),
    getTranslations("progress"),
    getTranslations("status"),
    getLocale(),
  ]);
  const { session, exercises } = data;
  const { last, history } = await loadRunnerContext(data);
  const exerciseIds = exercises
    .map((e) => e.source_exercise_id)
    .filter((id): id is string => Boolean(id));
  const suggestions =
    session.status === "completed" ? await getPendingSuggestions(locale, exerciseIds) : [];

  const completed = exercises.filter((e) => e.status === "completed");
  // Anything not completed when the workout was finished counts as skipped.
  const skipped = exercises.filter((e) => e.status !== "completed");
  const records = exercises.flatMap((e) =>
    e.source_exercise_id
      ? newRecordsInSession(
          e.tracking_mode_snapshot,
          history.filter((h) => h.exercise_id === e.source_exercise_id),
          session.id,
        ).map((r) => ({ name: e.exercise_name_snapshot, record: r }))
      : [],
  );
  const date = localDate(session.started_at, timeZone);
  const compareIcon = { better: ArrowUpRight, same: ArrowRight, worse: ArrowDownRight } as const;
  const compareTone = { better: "success", same: "neutral", worse: "warning" } as const;

  return (
    <main className="pt-safe mx-auto w-full max-w-xl px-4 pt-4 pb-16">
      <PageHeader
        title={t("summaryTitle")}
        subtitle={`${session.title_snapshot} · ${formatIsoDate(date, locale, { weekday: "long", day: "numeric", month: "long" })}`}
        backHref={`/calendar?week=${date}`}
        backLabel={ts("completed")}
      />
      <div className="mb-4 flex flex-wrap gap-1.5">
        <Badge tone={session.status === "completed" ? "success" : "neutral"}>
          {session.status === "completed" ? ts("completed") : ts("planned")}
        </Badge>
        {session.session_rpe ? <Badge tone="info">RPE {session.session_rpe}/10</Badge> : null}
        {session.energy_after ? (
          <Badge>
            {t("energyAfter").replace(/\s*\(.*\)/, "")}: {session.energy_after}/5
          </Badge>
        ) : null}
        {session.recovery_rating ? <Badge>{session.recovery_rating}/5</Badge> : null}
      </div>
      {session.notes ? (
        <Card className="text-ink-muted mb-4 text-sm italic">{session.notes}</Card>
      ) : null}

      {records.length ? (
        <Card className="border-accent/40 mb-4 border-2">
          <CardTitle className="mb-2 flex items-center gap-2 text-base">
            <Trophy aria-hidden="true" className="text-accent size-5" />
            {t("newRecords")}
          </CardTitle>
          <ul className="space-y-1 text-sm">
            {records.map(({ name, record }, i) => (
              <li key={i}>
                <span className="font-semibold">{name}</span>: {formatRecord(record, tp, locale)}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <section className="mb-4" aria-labelledby="done-list">
        <h2
          id="done-list"
          className="text-ink-muted mb-2 text-sm font-bold tracking-wide uppercase"
        >
          {t("completedExercises")} · {completed.length}/{exercises.length}
        </h2>
        <ul className="divide-border bg-surface divide-y overflow-hidden rounded-[var(--radius-card)] shadow-[var(--shadow-card)]">
          {completed.map((e) => {
            const prev = e.source_exercise_id ? last[e.source_exercise_id] : undefined;
            const cmp = compareToLast(e.tracking_mode_snapshot, e.sets, prev?.sets);
            const Icon = cmp ? compareIcon[cmp] : null;
            return (
              <li key={e.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{e.exercise_name_snapshot}</p>
                  <Badge tone={cmp ? compareTone[cmp] : "neutral"}>
                    {Icon ? <Icon aria-hidden="true" /> : null}
                    {cmp ? t(cmp) : t("noComparison")}
                  </Badge>
                </div>
                <p className="text-ink-muted text-sm">
                  {formatSetsSummary(e.sets, e.tracking_mode_snapshot, locale)}
                </p>
                {e.pain_flag ? (
                  <Badge tone="danger" className="mt-1">
                    {t("painFlag")}
                  </Badge>
                ) : null}
                {e.notes ? <p className="text-ink-subtle text-sm italic">{e.notes}</p> : null}
              </li>
            );
          })}
        </ul>
      </section>

      {skipped.length ? (
        <section className="mb-4" aria-labelledby="skipped-list">
          <h2
            id="skipped-list"
            className="text-ink-muted mb-2 text-sm font-bold tracking-wide uppercase"
          >
            {t("skippedExercises")} · {skipped.length}
          </h2>
          <ul className="bg-surface rounded-[var(--radius-card)] px-4 py-2 text-sm shadow-[var(--shadow-card)]">
            {skipped.map((e) => (
              <li key={e.id} className="py-1">
                {e.exercise_name_snapshot}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {suggestions.length ? (
        <section className="mb-4 space-y-2" aria-labelledby="suggestions">
          <h2 id="suggestions" className="text-ink-muted text-sm font-bold tracking-wide uppercase">
            {t("suggestions")}
          </h2>
          {suggestions.map((s) => (
            <SuggestionCard key={s.id} suggestion={s} />
          ))}
        </section>
      ) : null}

      <div className="flex flex-col gap-2">
        <Button asChild variant="outline" size="lg">
          <Link href={`/sessions/${session.id}/edit`}>
            <Pencil aria-hidden="true" />
            {t("editSession")}
          </Link>
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link href="/calendar">{(await getTranslations("common"))("goToCalendar")}</Link>
        </Button>
      </div>
    </main>
  );
}
