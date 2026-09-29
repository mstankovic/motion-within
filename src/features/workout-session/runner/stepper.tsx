"use client";

import { useRef } from "react";
import { Minus, Plus } from "lucide-react";
import { parseNumber } from "@/components/ui/number-input";
import { cn } from "@/lib/cn";

/** Big-target numeric control: − [value] +. The value slides in the direction it changed. */
export function Stepper({
  label,
  value,
  onChange,
  step = 1,
  decimal = false,
  placeholder,
  decreaseLabel,
  increaseLabel,
  className,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  step?: number;
  decimal?: boolean;
  placeholder?: string;
  decreaseLabel: string;
  increaseLabel: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const base = value ?? (placeholder ? Number(placeholder) || 0 : 0);
  const round = (n: number) => Math.max(0, Math.round(n * 100) / 100);

  function nudge(direction: 1 | -1) {
    onChange(round(base + direction * step));
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    inputRef.current?.animate?.(
      [
        { opacity: 0, transform: `translateY(${direction * 45}%)` },
        { opacity: 1, transform: "none" },
      ],
      { duration: 160, easing: "cubic-bezier(0.05, 0.7, 0.1, 1)" },
    );
  }

  const buttonClass =
    "pressable-sm text-ink-muted active:bg-surface-muted flex w-11 shrink-0 items-center justify-center focus-visible:-outline-offset-3";
  return (
    <div
      className={cn(
        "border-border bg-surface focus-within:border-brand ease-standard flex items-stretch overflow-hidden rounded-[var(--radius-control)] border transition-[border-color,box-shadow] duration-(--dur-base) focus-within:shadow-[0_0_0_4px_var(--color-brand-soft)]",
        className,
      )}
    >
      <button
        type="button"
        aria-label={decreaseLabel}
        className={buttonClass}
        onClick={() => nudge(-1)}
      >
        <Minus aria-hidden="true" className="size-4.5" />
      </button>
      <input
        ref={inputRef}
        aria-label={label}
        type="text"
        inputMode={decimal ? "decimal" : "numeric"}
        autoComplete="off"
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => onChange(parseNumber(e.target.value, decimal))}
        onFocus={(e) => e.currentTarget.select()}
        className="placeholder:text-ink-subtle h-[3.125rem] w-full min-w-0 bg-transparent text-center text-xl font-extrabold placeholder:font-medium focus:outline-none"
      />
      <button
        type="button"
        aria-label={increaseLabel}
        className={buttonClass}
        onClick={() => nudge(1)}
      >
        <Plus aria-hidden="true" className="size-4.5" />
      </button>
    </div>
  );
}
