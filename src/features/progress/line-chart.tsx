"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/states";

export type ChartPoint = { x: string; y: number; label?: string };

// Recharts is only loaded on progress screens.
const Inner = dynamic(() => import("./line-chart-inner"), {
  ssr: false,
  loading: () => <Skeleton className="h-56" />,
});

/** Line chart with a mandatory text summary for screen readers and small screens. */
export function LineChart({
  points,
  unit,
  summary,
  label,
}: {
  points: ChartPoint[];
  unit?: string;
  summary: string;
  label: string;
}) {
  return (
    <figure>
      <div role="img" aria-label={`${label}. ${summary}`}>
        <Inner points={points} unit={unit} />
      </div>
      <figcaption className="text-ink-muted mt-2 text-sm">{summary}</figcaption>
    </figure>
  );
}
