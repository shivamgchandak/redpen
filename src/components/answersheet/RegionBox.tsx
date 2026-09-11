import { cn } from "@/lib/cn";
import type { Region } from "@/lib/types";

export function RegionBox({
  region,
  label,
  span,
  muted = false,
}: {
  region: Region;
  label?: string;
  span?: string;
  muted?: boolean;
}) {
  return (
    <span
      className={cn(
        "absolute rounded-[4px] transition-colors",
        muted
          ? "border border-hairline/70 bg-transparent"
          : "border-[1.5px] border-success bg-success/10"
      )}
      style={{
        left: `${region.x * 100}%`,
        top: `${region.y * 100}%`,
        width: `${region.w * 100}%`,
        height: `${region.h * 100}%`,
      }}
    >
      {!muted && label && (
        <span className="absolute -left-px -top-5 rounded-[4px] bg-success px-1.5 py-0.5 text-[10px] font-semibold text-surface">
          {label}
          {span && <span className="ml-1 font-normal opacity-80">{span}</span>}
        </span>
      )}
    </span>
  );
}
