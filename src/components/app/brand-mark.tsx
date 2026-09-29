import { cn } from "@/lib/cn";

/** Motion Within mark: an inner circle in motion. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={cn("shrink-0", className)}>
      <rect width="64" height="64" rx="18" fill="#0f6e62" />
      <path
        d="M14 40c5-12 11-18 18-18s13 6 18 18"
        fill="none"
        stroke="#dcefe9"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="32" cy="22" r="6" fill="#e3714d" />
    </svg>
  );
}
