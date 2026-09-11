"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsRight } from "lucide-react";
import { GoogleSignInButton } from "@/components/auth";
import { cn } from "@/lib/cn";
import { LogoutLink } from "./LogoutLink";
import { isActive } from "./navItems";
import SettingsIcon from "../../../public/images/Setting.png";

export function SidebarFooter({
  collapsed,
  onExpand,
  signedIn,
  showLogout = false,
  showGuestPrompt = false,
  onNavigate,
}: {
  collapsed: boolean;
  onExpand?: () => void;
  signedIn: boolean;
  showLogout?: boolean;
  /** Mobile drawer only: on desktop the top bar already has a Sign in button. */
  showGuestPrompt?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const settingsActive = isActive("/settings", pathname);

  return (
    <div className={cn("mt-auto flex flex-col gap-2", collapsed && "items-center")}>
      {signedIn ? (
        <Link
          href="/settings"
          onClick={onNavigate}
          title={collapsed ? "Settings" : undefined}
          aria-current={settingsActive ? "page" : undefined}
          className={cn(
            "flex items-center gap-2 rounded-chip transition-colors",
            collapsed ? "size-10 justify-center" : "px-3 py-2",
            settingsActive
              ? "bg-surface-dim font-semibold text-ink"
              : "text-muted hover:bg-surface-soft hover:text-ink"
          )}
        >
          <Image src={SettingsIcon} alt="" width={20} height={20} />
          {!collapsed && <span className="text-[16px]">Settings</span>}
        </Link>
      ) : (
        showGuestPrompt &&
        !collapsed && (
          <div className="flex flex-col gap-2 rounded-field bg-surface-soft p-3">
            <p className="text-p5 text-subtle">
              You are in demo mode. Sign in to create classes and save marks.
            </p>
            <GoogleSignInButton size="sm" variant="dark" />
          </div>
        )
      )}

      {signedIn && showLogout && <LogoutLink />}

      {collapsed && onExpand && (
        <button
          type="button"
          onClick={onExpand}
          aria-label="Expand sidebar"
          className="grid size-8 place-items-center text-subtle transition-colors hover:text-ink"
        >
          <ChevronsRight className="size-4" strokeWidth={1.8} />
        </button>
      )}
    </div>
  );
}
