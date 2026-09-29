import { Skeleton } from "@/components/ui/states";

export default function Loading() {
  return (
    <div aria-busy="true" className="mx-auto w-full max-w-xl space-y-4 px-4 pt-6">
      <Skeleton className="h-14" />
      <Skeleton className="h-9 w-3/4" />
      <Skeleton className="h-24" />
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
    </div>
  );
}
