import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { formatIsoDate } from "@/lib/dates";
import { formatSetValue } from "@/features/workout-session/format";
import type { Performance, TrackingMode } from "@/features/workout-session/types";

export async function PerformanceList({
  performances,
  mode,
  timeZone,
}: {
  performances: Performance[];
  mode: TrackingMode;
  timeZone: string;
}) {
  const [t, tw, locale] = await Promise.all([
    getTranslations("progress"),
    getTranslations("workout"),
    getLocale(),
  ]);
  return (
    <ol className="divide-border bg-surface divide-y overflow-hidden rounded-[var(--radius-card)] shadow-[var(--shadow-card)]">
      {performances.map((p) => {
        const date = new Intl.DateTimeFormat("en-CA", { timeZone }).format(
          new Date(p.performed_at),
        );
        const working = p.sets.filter((s) => !s.is_warmup);
        const rpes = working.map((s) => s.rpe).filter((r): r is number => r != null);
        return (
          <li key={p.session_exercise_id}>
            <Link
              href={`/sessions/${p.session_id}`}
              className="active:bg-surface-muted block px-4 py-3 transition-colors duration-(--dur-fast)"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">
                  {formatIsoDate(date, locale, { day: "numeric", month: "short", year: "numeric" })}
                </p>
                <div className="flex gap-1">
                  {p.status === "skipped" ? <Badge>{tw("exerciseSkipped")}</Badge> : null}
                  {p.pain_flag ? <Badge tone="danger">{t("painBadge")}</Badge> : null}
                  {rpes.length ? (
                    <Badge tone="info">{t("rpeShort", { value: Math.max(...rpes) })}</Badge>
                  ) : null}
                </div>
              </div>
              <ul className="text-ink-muted mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-sm">
                {working.map((s) => (
                  <li key={s.set_number} className={s.completed ? "" : "line-through opacity-60"}>
                    {formatSetValue(s, mode, locale)}
                  </li>
                ))}
              </ul>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
