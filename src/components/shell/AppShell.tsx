"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { TopBar } from "./TopBar";
import type { ShellUser } from "./types";
import { useShellUser } from "./UserContext";

export function AppShell({
  children,
  crumb,
  collapsedSidebar = false,
  onBack,
  backHref,
  user: userProp,
  banner,
}: {
  children: React.ReactNode;
  crumb?: string;
  collapsedSidebar?: boolean;
  onBack?: () => void;
  /** Back arrow target, for pages rendered on the server. */
  backHref?: string;
  /** Current teacher; null shows the guest menu. Defaults to the ShellUserProvider value. */
  user?: ShellUser | null;
  /** Optional strip shown between the top bar and the page. */
  banner?: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const contextUser = useShellUser();
  const user = userProp === undefined ? contextUser : userProp;

  return (
    <div className="relative flex h-[100svh] gap-3 overflow-hidden p-3">
      <span
        className="rp-glow left-[16%] top-[62%] h-[428px] w-[1318px] opacity-25"
        aria-hidden
      />
      <span
        className="rp-glow left-[22%] top-[12%] h-[428px] w-[1113px] opacity-20"
        aria-hidden
      />

      <Sidebar signedIn={Boolean(user)} defaultCollapsed={collapsedSidebar} />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col gap-3">
        <TopBar
          crumb={crumb}
          onBack={onBack}
          backHref={backHref}
          user={user}
          onMenu={() => setMenuOpen(true)}
        />
        {banner}
        <main className="rp-canvas flex min-h-0 flex-1 flex-col overflow-y-auto rounded-hero">
          {children}
        </main>
      </div>

      <MobileNav open={menuOpen} user={user} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
