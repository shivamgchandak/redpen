import { AppShell } from "@/components/shell";
import { PageBody } from "@/components/ui/Page";
import { CardGridSkeleton, HeaderSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <AppShell crumb="My Classes">
      <PageBody>
        <HeaderSkeleton />
        <CardGridSkeleton />
      </PageBody>
    </AppShell>
  );
}
