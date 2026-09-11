"use client";

import { SidebarBrand } from "./SidebarBrand";
import { SidebarFooter } from "./SidebarFooter";
import { SidebarNav } from "./SidebarNav";

export function SidebarContent({
  collapsed,
  signedIn,
  onCollapse,
  onExpand,
  showLogout = false,
  showGuestPrompt = false,
  onNavigate,
}: {
  collapsed: boolean;
  signedIn: boolean;
  onCollapse?: () => void;
  onExpand?: () => void;
  showLogout?: boolean;
  showGuestPrompt?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <>
      <SidebarBrand collapsed={collapsed} onCollapse={onCollapse} />
      <SidebarNav collapsed={collapsed} signedIn={signedIn} onNavigate={onNavigate} />
      <SidebarFooter
        collapsed={collapsed}
        onExpand={onExpand}
        signedIn={signedIn}
        showLogout={showLogout}
        showGuestPrompt={showGuestPrompt}
        onNavigate={onNavigate}
      />
    </>
  );
}
