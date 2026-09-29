import { CheckCircle2, Circle, CircleDashed, PlayCircle, SkipForward } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

export type DayStatus = "planned" | "in_progress" | "completed" | "skipped" | "rest";

const icons = {
  planned: Circle,
  in_progress: PlayCircle,
  completed: CheckCircle2,
  skipped: SkipForward,
  rest: CircleDashed,
} as const;

const colors = {
  planned: "text-brand",
  in_progress: "text-accent",
  completed: "text-success",
  skipped: "text-ink-subtle",
  rest: "text-border",
} as const;

const tones = {
  planned: "brand",
  in_progress: "accent",
  completed: "success",
  skipped: "neutral",
  rest: "neutral",
} as const;

/** Shape + color icon; always paired with text (visible or screen-reader). */
export function StatusIcon({ status, className }: { status: DayStatus; className?: string }) {
  const Icon = icons[status];
  return <Icon aria-hidden="true" className={cn("size-5", colors[status], className)} />;
}

export function StatusBadge({ status }: { status: DayStatus }) {
  const t = useTranslations("status");
  const Icon = icons[status];
  return (
    <Badge tone={tones[status]}>
      <Icon aria-hidden="true" />
      {t(status)}
    </Badge>
  );
}

/** Combined status for a calendar day with possibly several workouts. */
export function dayStatus(statuses: Exclude<DayStatus, "rest">[]): DayStatus {
  if (!statuses.length) return "rest";
  for (const s of ["in_progress", "planned", "completed", "skipped"] as const) {
    if (statuses.includes(s)) return s;
  }
  return "rest";
}
