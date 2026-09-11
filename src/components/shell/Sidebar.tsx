"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { SidebarContent } from "./SidebarContent";

export function Sidebar({
  signedIn,
  defaultCollapsed = false,
}: {
  signedIn: boolean;
  defaultCollapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  useEffect(() => {
    setCollapsed(defaultCollapsed);
  }, [defaultCollapsed]);

  return (
    <aside
      className={cn(
        "relative z-10 hidden shrink-0 flex-col overflow-y-auto overscroll-contain rounded-panel bg-surface transition-[width] duration-300 ease-out lg:flex",
        collapsed ? "w-[72px] items-center px-3 py-6" : "w-[280px] p-6"
      )}
    >
      <SidebarContent
        collapsed={collapsed}
        signedIn={signedIn}
        onCollapse={() => setCollapsed(true)}
        onExpand={() => setCollapsed(false)}
      />
    </aside>
  );
}
