import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { LoaderCircle } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export const buttonVariants = cva(
  "pressable inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-[var(--radius-control)] px-5 text-[0.9375rem] leading-5 font-semibold select-none disabled:pointer-events-none disabled:opacity-45 aria-busy:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-brand text-on-brand active:bg-brand-strong",
        /** Coral: the single primary action of a screen (Today card) and live state. */
        accent: "bg-accent text-on-accent active:brightness-95",
        secondary: "bg-brand-soft text-brand-strong active:brightness-95",
        outline: "border border-border bg-surface text-ink active:bg-surface-muted",
        ghost: "text-ink active:bg-surface-muted",
        danger: "bg-danger-soft text-danger active:brightness-95",
        link: "min-h-0 min-w-0 px-1 text-brand underline underline-offset-4",
      },
      size: {
        md: "h-12",
        lg: "h-14 w-full text-base",
        sm: "h-11 px-3.5 text-sm",
        icon: "size-12 rounded-full px-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /**
     * Work in progress after a tap: shows a spinner at full strength (not the faded disabled
     * look) and ignores further taps, so the press is acknowledged instantly.
     */
    loading?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  asChild,
  type,
  loading,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      type={asChild ? undefined : (type ?? "button")}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      {...props}
    >
      {loading && !asChild ? (
        <>
          <LoaderCircle aria-hidden="true" className="animate-spin" />
          {children}
        </>
      ) : (
        children
      )}
    </Comp>
  );
}
