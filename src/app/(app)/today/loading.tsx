import { Skeleton } from "@/components/ui/states";

/** Shaped like the final zones so nothing jumps: header, hero, week card, Up next. */
export default function Loading() {
  return (
    <div aria-busy="true" className="flex flex-col gap-5.5">
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-[1.125rem] w-40 rounded-md" />
        <Skeleton className="h-9 w-3/4 rounded-lg" />
        <Skeleton className="h-[1.375rem] w-2/3 rounded-md" />
      </div>
      <Skeleton className="h-[16.75rem] rounded-[var(--radius-sheet)]" />
      <div className="bg-surface-muted h-[12.25rem] rounded-[var(--radius-card)]" />
      <div className="flex flex-col gap-2">
        <div className="bg-surface-muted h-5 w-24 rounded-md" />
        <div className="bg-surface-muted h-36 rounded-[var(--radius-card)]" />
      </div>
    </div>
  );
}
