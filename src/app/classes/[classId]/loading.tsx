import { AppShell } from "@/components/shell";
import { PageBody } from "@/components/ui/Page";
import { HeaderSkeleton, ListSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <AppShell crumb="Loading..." backHref="/classes">
      <PageBody>
        <HeaderSkeleton />
        <Skeleton className="h-11 w-64 rounded-pill" />
        <ListSkeleton rows={4} />
      </PageBody>
    </AppShell>
  );
}
