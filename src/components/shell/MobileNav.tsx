"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { SidebarContent } from "./SidebarContent";
import type { ShellUser } from "./types";

export function MobileNav({
  open,
  onClose,
  user = null,
}: {
  open: boolean;
  onClose: () => void;
  user?: ShellUser | null;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 lg:hidden",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        aria-label="Close menu"
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-ink/40 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={cn(
          "absolute right-0 top-0 flex h-full w-[300px] max-w-[86vw] flex-col overflow-y-auto overscroll-contain bg-surface p-5 transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            tabIndex={open ? 0 : -1}
            className="grid size-9 place-items-center rounded-pill text-muted transition-colors hover:bg-surface-soft hover:text-ink"
          >
            <X className="size-5" strokeWidth={1.8} />
          </button>
        </div>

        {user && (
          <p className="mb-2 truncate px-1 text-p5 text-subtle">Signed in as {user.email || user.name}</p>
        )}

        <SidebarContent
          collapsed={false}
          signedIn={Boolean(user)}
          showLogout={Boolean(user)}
          showGuestPrompt={!user}
          onNavigate={onClose}
        />
      </aside>
    </div>
  );
}
