import { cn } from "@/lib/cn";
import type { WeekSummary } from "./derive";

const colors = {
  completed: "bg-success animate-fill origin-left",
  in_progress: "bg-accent",
  not_logged: "bg-warning-bar",
  planned: "bg-border",
} as const;

/** One 6px segment per counted workout (skipped excluded), so the bar and the count agree. */
export function WeekSegments({ segments }: { segments: WeekSummary["segments"] }) {
  return (
    <div aria-hidden="true" className="flex h-1.5 gap-1">
      {segments.map((s, i) => (
        <span key={i} className={cn("flex-1 rounded-[3px]", colors[s])} />
      ))}
    </div>
  );
}
