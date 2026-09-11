import type { ActiveAnswer } from "./answerRegions";

export function SheetFooter({
  active,
  selected,
}: {
  active: ActiveAnswer | null;
  selected: string | null;
}) {
  if (active && active.regions.length > 1) {
    const count = active.regions.length;
    return (
      <footer className="border-t border-hairline/50 px-4 py-2 text-p5 text-muted">
        This answer runs across {count === 2 ? "two pages" : `${count} pages`} -
        pages {active.regions.map((r) => r.page + 1).join(", ")}.
      </footer>
    );
  }

  if (selected && !active) {
    return (
      <footer className="border-t border-hairline/50 px-4 py-2 text-p5 text-muted">
        Nothing on the sheet maps to this question. It was left unattempted.
      </footer>
    );
  }

  return null;
}
