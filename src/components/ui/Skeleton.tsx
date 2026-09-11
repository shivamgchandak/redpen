import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-field bg-surface-dim", className)} />;
}

/** Placeholder for a page header while data loads. */
export function HeaderSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-8 w-56 sm:h-9 sm:w-72" />
      <Skeleton className="h-4 w-40" />
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col gap-4 rounded-card bg-surface p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="size-10" />
          </div>
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col divide-y divide-hairline/60 rounded-card bg-surface">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-4">
          <Skeleton className="size-9 rounded-pill" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/5" />
          </div>
          <Skeleton className="h-8 w-24 rounded-pill" />
        </div>
      ))}
    </div>
  );
}
