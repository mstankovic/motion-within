import { SkipForward } from "lucide-react";
import type { StripStatus } from "@/features/today/derive";
import { cn } from "@/lib/cn";

/** 18px day mark: shape carries the meaning, color reinforces it (label is on the tile). */
export function StatusMark({ status }: { status: StripStatus }) {
  const size = "size-[1.125rem]";
  switch (status) {
    case "completed":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={size}>
          <circle cx="12" cy="12" r="11" className="fill-success" />
          <path
            d="m7.5 12.5 3 3 6-6.5"
            fill="none"
            className="stroke-on-success"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "planned":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={size}>
          <circle cx="12" cy="12" r="9.5" fill="none" className="stroke-brand" strokeWidth="2.6" />
        </svg>
      );
    case "in_progress":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={size}>
          <circle cx="12" cy="12" r="11" className="fill-accent" />
          <polygon points="10 8 16.5 12 10 16" className="fill-on-accent" />
        </svg>
      );
    case "not_logged":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={size}>
          <circle
            cx="12"
            cy="12"
            r="11"
            className="fill-warning-soft stroke-warning"
            strokeWidth="2"
          />
          <path d="M12 7v6" className="stroke-warning" strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="12" cy="16.6" r="1.4" className="fill-warning" />
        </svg>
      );
    case "skipped":
      return (
        <SkipForward aria-hidden="true" className={cn(size, "text-ink-subtle")} strokeWidth={2.4} />
      );
    default:
      return <span aria-hidden="true" className="bg-dot size-1 rounded-full" />;
  }
}
