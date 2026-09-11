"use client";

export function QuestionListHeader({
  allOpen,
  onToggleAll,
}: {
  allOpen: boolean;
  onToggleAll: () => void;
}) {
  return (
    <div className="flex h-15 items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-4">
      <h2 className="min-w-0 truncate text-[16px] font-bold text-ink">
        Extracted Questions{" "}
        <span className="hidden sm:inline">(from question paper)</span>
      </h2>
      <button
        type="button"
        onClick={onToggleAll}
        className="h-[45px] w-auto shrink-0 whitespace-nowrap rounded-pill bg-white px-4 py-1 text-[14px] font-medium text-[#181818] transition-colors sm:w-[100px] sm:px-3"
      >
        {allOpen ? "Collapse All" : "Expand All"}
      </button>
    </div>
  );
}
