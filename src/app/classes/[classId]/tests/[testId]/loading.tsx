import { AppShell } from "@/components/shell";
import { PageBody } from "@/components/ui/Page";
import { HeaderSkeleton, ListSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <AppShell crumb="Loading...">
      <PageBody>
        <HeaderSkeleton />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[104px] rounded-card" />
          ))}
        </div>
        <ListSkeleton rows={8} />
      </PageBody>
    </AppShell>
  );
}
