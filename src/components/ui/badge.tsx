import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-semibold tracking-[0.01em] whitespace-nowrap [&_svg]:size-3.5",
  {
    variants: {
      tone: {
        neutral: "bg-surface-muted text-ink-muted",
        brand: "bg-brand-soft text-brand-strong",
        success: "bg-success-soft text-success",
        warning: "bg-warning-soft text-warning",
        danger: "bg-danger-soft text-danger",
        info: "bg-info-soft text-info",
        accent: "bg-accent-soft text-accent-strong",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

/** Pulsing accent dot for something running right now (the only looping badge). */
export function LiveDot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("bg-accent animate-live size-2 shrink-0 rounded-full", className)}
    />
  );
}
