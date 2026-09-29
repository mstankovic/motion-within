import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
  headingLevel,
}: {
  headingLevel?: 1 | 2;
  icon?: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border flex flex-col items-center gap-2 rounded-[var(--radius-card)] border-[1.5px] border-dashed px-5 py-8 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="animate-pop mb-1">
          <div className="bg-brand-soft text-brand-strong animate-breathe flex size-16 items-center justify-center rounded-full [&_svg]:size-7">
            {icon}
          </div>
        </div>
      ) : null}
      {headingLevel === 1 ? (
        <h1 className="text-xl font-bold">{title}</h1>
      ) : headingLevel === 2 ? (
        <h2 className="text-[1.0625rem] leading-6 font-bold">{title}</h2>
      ) : (
        <p className="text-[1.0625rem] leading-6 font-bold">{title}</p>
      )}
      {body ? <p className="text-ink-muted max-w-72 text-sm">{body}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-shimmer from-surface-muted via-surface to-surface-muted motion-reduce:bg-surface-muted rounded-[var(--radius-card)] bg-linear-90 from-30% via-50% to-70% bg-size-[200%_100%] motion-reduce:bg-none",
        className,
      )}
    />
  );
}

export function Notice({
  tone = "info",
  children,
  className,
}: {
  tone?: "info" | "warning" | "success" | "danger";
  children: ReactNode;
  className?: string;
}) {
  const tones = {
    info: "bg-info-soft text-info",
    warning: "bg-warning-soft text-warning",
    success: "bg-success-soft text-success",
    danger: "bg-danger-soft text-danger",
  } as const;
  return (
    <div
      className={cn(
        "animate-fade-down rounded-[var(--radius-control)] px-4 py-3 text-sm",
        tones[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}
