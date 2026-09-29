import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "bg-surface rounded-[var(--radius-card)] p-4 shadow-(--shadow-card)",
        className,
      )}
      {...props}
    />
  );
}

/** Classes for a whole-card link or button: sinks on press and lifts its shadow. */
export const interactiveCardClass =
  "block bg-surface rounded-[var(--radius-card)] p-4 shadow-(--shadow-card) transition-[transform,box-shadow] duration-(--dur-fast) ease-spring active:scale-[0.985] active:shadow-(--shadow-raised) active:duration-(--dur-instant)";

export function CardTitle({ className, ...props }: ComponentProps<"h2">) {
  return (
    <h2
      className={cn("text-xl leading-[1.625rem] font-bold tracking-[-0.01em]", className)}
      {...props}
    />
  );
}
