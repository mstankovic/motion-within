"use client";

import { cn } from "@/lib/cn";

/** Accessible 1…N rating as a radio group with large touch targets. */
export function ScalePicker({
  name,
  label,
  min = 1,
  max,
  value,
  onChange,
  className,
}: {
  name: string;
  label: string;
  min?: number;
  max: number;
  value: number | null;
  onChange: (value: number | null) => void;
  className?: string;
}) {
  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <fieldset className={className}>
      <legend className="mb-1.5 text-sm font-semibold">{label}</legend>
      <div className="grid grid-cols-5 gap-1.5">
        {options.map((n) => {
          const checked = value === n;
          return (
            <label
              key={n}
              className={cn(
                "pressable-sm has-[:focus-visible]:outline-brand flex h-12 cursor-pointer items-center justify-center rounded-[var(--radius-control)] border text-base font-bold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2",
                checked
                  ? "border-brand bg-brand text-on-brand animate-pop"
                  : "border-border bg-surface text-ink active:bg-surface-muted",
              )}
            >
              <input
                type="radio"
                name={name}
                value={n}
                checked={checked}
                onChange={() => onChange(n)}
                onClick={() => {
                  if (checked) onChange(null);
                }}
                className="sr-only"
              />
              {n}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
