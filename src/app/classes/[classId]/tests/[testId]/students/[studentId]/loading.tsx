import { AppShell } from "@/components/shell";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <AppShell crumb="Loading result..." collapsedSidebar>
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
        <Skeleton className="h-16 rounded-hero" />
        <Skeleton className="h-14 rounded-hero" />
        <div className="flex min-h-0 flex-1 gap-3">
          <div className="flex flex-1 flex-col gap-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-16 rounded-panel bg-surface" />
            ))}
          </div>
          <Skeleton className="hidden flex-1 rounded-card bg-ink-strong/80 lg:block" />
        </div>
      </div>
    </AppShell>
  );
}
