import { useId, type ComponentProps, type ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

export const controlClass =
  "block w-full min-h-12 rounded-[var(--radius-control)] border border-border bg-surface px-3 text-base font-medium text-ink placeholder:text-ink-subtle transition-[border-color,box-shadow] duration-(--dur-base) ease-standard focus-visible:border-brand focus-visible:shadow-[0_0_0_4px_var(--color-brand-soft)] focus-visible:outline-none aria-invalid:border-danger aria-invalid:animate-shake aria-invalid:focus-visible:shadow-[0_0_0_4px_var(--color-danger-soft)] disabled:opacity-60";

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("mb-1.5 block text-sm font-semibold", className)} {...props} />;
}

type FieldProps = {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
};

/** Label + control + hint/error, wired with ids for assistive tech. */
export function Field({ label, hint, error, className, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && !error ? (
        <p id={hintId} className="text-ink-muted mt-1.5 text-sm">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          className="text-danger animate-fade-down mt-1.5 flex items-center gap-1.5 text-sm font-semibold"
        >
          <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(controlClass, "h-12", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(controlClass, "min-h-22 py-2.5", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(controlClass, "h-12 pr-8", className)} {...props} />;
}
