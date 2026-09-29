import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel,
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  backHref?: string;
  backLabel?: string;
  action?: ReactNode;
}) {
  return (
    <header className="animate-fade-in mb-4 flex items-start gap-2">
      {backHref ? (
        <Link
          href={backHref}
          aria-label={backLabel}
          className="pressable-sm text-ink active:bg-surface-muted -ml-2 flex size-12 shrink-0 items-center justify-center rounded-full"
        >
          <ChevronLeft aria-hidden="true" className="size-6" />
        </Link>
      ) : null}
      <div className="min-w-0 flex-1 pt-1.5">
        <h1 className="text-[1.75rem] leading-[2.125rem] font-extrabold tracking-[-0.015em]">
          {title}
        </h1>
        {subtitle ? <p className="text-ink-muted mt-0.5 text-sm">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
