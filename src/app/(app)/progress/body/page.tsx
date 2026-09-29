import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { DeleteMeasurementButton } from "@/features/measurements/delete-measurement-button";
import { MeasurementForm } from "@/features/measurements/measurement-form";
import { LineChart } from "@/features/progress/line-chart";
import { formatIsoDate, formatNumber, todayInTimeZone } from "@/lib/dates";
import { createClient, getProfile } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("body"))("title") };
}

const FIELDS = [
  ["weight_kg", "weight", "kg"],
  ["waist_cm", "waist", "cm"],
  ["chest_cm", "chest", "cm"],
  ["hips_cm", "hips", "cm"],
  ["upper_arm_cm", "upperArm", "cm"],
  ["thigh_cm", "thigh", "cm"],
] as const;

export default async function BodyPage() {
  const [t, tp, locale, profile] = await Promise.all([
    getTranslations("body"),
    getTranslations("progress"),
    getLocale(),
    getProfile(),
  ]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("body_measurements")
    .select("*")
    .order("measured_on")
    .limit(365);
  if (error) throw error;
  const today = todayInTimeZone(profile.timezone);

  const charts = FIELDS.map(([key, label, unit]) => ({
    key,
    label: t(label),
    unit,
    points: data
      .filter((m) => m[key] != null)
      .map((m) => ({
        x: formatIsoDate(m.measured_on, locale, { day: "numeric", month: "numeric" }),
        y: Number(m[key]),
      })),
  })).filter((c) => c.points.length >= 2);

  return (
    <>
      <PageHeader title={t("title")} backHref="/progress" backLabel={tp("title")} />
      <div className="space-y-4">
        <MeasurementForm today={today} />
        {data.length === 0 ? <EmptyState title={t("empty")} body={t("emptyBody")} /> : null}
        {charts.map((c) => (
          <Card key={c.key}>
            <CardTitle className="mb-2 text-base">{c.label}</CardTitle>
            <LineChart
              label={c.label}
              points={c.points}
              unit={c.unit}
              summary={tp("chartSummary", {
                first: `${formatNumber(c.points[0].y, locale)} ${c.unit}`,
                last: `${formatNumber(c.points.at(-1)!.y, locale)} ${c.unit}`,
                count: c.points.length,
              })}
            />
          </Card>
        ))}
        {data.length ? (
          <section aria-labelledby="body-history">
            <h2 id="body-history" className="mb-2 text-lg font-bold">
              {t("history")}
            </h2>
            <ul className="divide-border bg-surface divide-y overflow-hidden rounded-[var(--radius-card)] shadow-[var(--shadow-card)]">
              {[...data].reverse().map((m) => {
                const date = formatIsoDate(m.measured_on, locale, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });
                return (
                  <li key={m.id} className="flex items-start gap-2 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{date}</p>
                      <p className="text-ink-muted text-sm">
                        {FIELDS.filter(([k]) => m[k] != null)
                          .map(
                            ([k, label, unit]) =>
                              `${t(label).replace(/\s*\(.*\)/, "")}: ${formatNumber(Number(m[k]), locale)} ${unit}`,
                          )
                          .join(" · ")}
                      </p>
                      {m.notes ? <p className="text-ink-subtle text-sm italic">{m.notes}</p> : null}
                    </div>
                    <DeleteMeasurementButton id={m.id} label={date} />
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  );
}
