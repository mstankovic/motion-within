import { Skeleton } from "@/components/ui/states";

export default function Loading() {
  return (
    <div aria-busy="true" className="space-y-4">
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="h-20" />
      <Skeleton className="h-44" />
      <Skeleton className="h-16" />
      <Skeleton className="h-16" />
    </div>
  );
}
