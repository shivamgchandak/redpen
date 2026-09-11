"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { GUEST_NAV, TEACHER_NAV, isActive } from "./navItems";

export function SidebarNav({
  collapsed,
  signedIn,
  onNavigate,
}: {
  collapsed: boolean;
  signedIn: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = signedIn ? TEACHER_NAV : GUEST_NAV;

  return (
    <nav className={cn("mt-8 flex flex-col gap-2", collapsed && "items-center")}>
      {items.map(({ href, label, icon }) => {
        const active = isActive(href, pathname);

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            title={collapsed ? label : undefined}
            className={cn(
              "flex items-center gap-2 rounded-chip transition-colors",
              collapsed ? "size-10 justify-center" : "px-3 py-[9px]",
              active
                ? "bg-surface-dim text-ink"
                : "text-muted hover:bg-surface-soft hover:text-ink"
            )}
          >
            <Image src={icon} alt="" width={20} height={20} />
            {!collapsed && (
              <span className={cn("text-[16px]", active ? "font-semibold" : "font-normal")}>
                {label}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
