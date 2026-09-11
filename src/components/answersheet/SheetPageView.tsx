import { RegionBox } from "./RegionBox";
import type { ActiveAnswer, OtherRegion } from "./answerRegions";
import type { SheetPage as SheetPageData } from "@/lib/types";

export function SheetPageView({
  sheet,
  index,
  active,
  others,
  pageRef,
}: {
  sheet: SheetPageData;
  index: number;
  active: ActiveAnswer | null;
  others: OtherRegion[];
  pageRef: (element: HTMLDivElement | null) => void;
}) {
  const activeHere = active?.regions.filter((r) => r.page === index) ?? [];
  const othersHere = others.filter((o) => o.region.page === index);

  return (
    <div ref={pageRef} className="relative">
      <img
        src={sheet.dataUrl}
        alt={`Answer sheet page ${index + 1}`}
        className="block w-full"
      />

      {othersHere.map((other, i) => (
        <RegionBox key={`other-${i}`} region={other.region} muted />
      ))}

      {activeHere.map((region, i) => {
        const position = active ? active.regions.indexOf(region) : 0;
        const total = active?.regions.length ?? 0;

        return (
          <RegionBox
            key={`active-${i}`}
            region={region}
            label={active?.label}
            span={total > 1 ? `${position + 1} of ${total}` : undefined}
          />
        );
      })}

      <span className="pointer-events-none absolute bottom-2 right-2 rounded-pill bg-ink/70 px-2 py-0.5 text-[10px] font-medium text-surface">
        {index + 1}
      </span>
    </div>
  );
}
