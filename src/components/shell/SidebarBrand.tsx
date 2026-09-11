"use client";

import Image from "next/image";
import Link from "next/link";
import { PanelLeft } from "lucide-react";
import { cn } from "@/lib/cn";
import RedPenLogo from "../../../public/images/RedPenLogo.png";

export function SidebarBrand({
  collapsed,
  onCollapse,
}: {
  collapsed: boolean;
  onCollapse?: () => void;
}) {
  return (
    <div
      className={cn(
        "flex h-10 items-center",
        collapsed ? "justify-center" : "justify-between gap-2"
      )}
    >
      <Link href="/" className="flex items-center gap-2" aria-label="RedPen home">
        <Image src={RedPenLogo} alt="RedPen logo" width={40} height={40} />
        {!collapsed && (
          <span className="text-[28px] font-bold text-ink">RedPen</span>
        )}
      </Link>

      {!collapsed && onCollapse && (
        <button
          type="button"
          onClick={onCollapse}
          aria-label="Collapse sidebar"
          className="grid size-5 place-items-center text-subtle transition-colors hover:text-ink"
        >
          <PanelLeft className="size-5" strokeWidth={1.6} />
        </button>
      )}
    </div>
  );
}
