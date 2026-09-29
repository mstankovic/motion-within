"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPoint } from "./line-chart";

export default function LineChartInner({ points, unit }: { points: ChartPoint[]; unit?: string }) {
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  return (
    <div className="h-56 w-full" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="x"
            tick={{ fontSize: 12, fill: "var(--color-ink-muted)" }}
            tickLine={false}
            axisLine={false}
            minTickGap={16}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "var(--color-ink-muted)" }}
            tickLine={false}
            axisLine={false}
            domain={["auto", "auto"]}
            width={48}
          />
          <Tooltip
            formatter={(value, _name, item) => {
              const label = (item?.payload as ChartPoint | undefined)?.label;
              return [`${value}${unit ? ` ${unit}` : ""}${label ? ` · ${label}` : ""}`, ""];
            }}
            separator=""
            contentStyle={{
              borderRadius: 14,
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              color: "var(--color-ink)",
              boxShadow: "var(--shadow-raised)",
            }}
          />
          <Line
            type="monotone"
            dataKey="y"
            stroke="var(--color-brand)"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "var(--color-brand)" }}
            activeDot={{ r: 6 }}
            isAnimationActive={!reduceMotion}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
