"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { LogoutLink } from "./LogoutLink";
import type { ShellUser } from "./types";
import DownCollaps from "../../../public/images/downcollaps.png";
import UserIcon from "../../../public/images/usericon.png";

export function ProfileMenu({ user }: { user: ShellUser }) {
  const name = user.name || user.email || "Teacher";

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex shrink-0 items-center gap-2 rounded-pill py-1 pl-1 pr-2 transition-colors hover:bg-surface-soft"
      >
        <Image src={UserIcon} alt="UserIcon" width={36} height={36} />
        <span className="max-w-[160px] truncate text-p4 font-medium text-ink">{name}</span>
        <Image
          src={DownCollaps}
          alt="DownCollaps"
          width={10}
          height={10}
          className={cn("transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-60 rounded-panel border border-hairline/50 bg-surface p-1.5 shadow-[0_12px_32px_rgba(24,24,24,0.12)]"
        >
          <p className="truncate px-3 pb-1.5 pt-1 text-[11px] text-subtle">
            Signed in as {user.email || user.name}
          </p>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center rounded-chip px-3 py-2 text-[14px] text-ink transition-colors hover:bg-surface-soft"
          >
            Settings
          </Link>
          <LogoutLink className="w-full text-[14px]" />
        </div>
      )}
    </div>
  );
}
