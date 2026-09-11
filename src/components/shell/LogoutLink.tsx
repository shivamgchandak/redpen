"use client";

import { LogOut } from "lucide-react";
import { signOutToHome } from "@/app/actions/auth";
import { cn } from "@/lib/cn";

export function LogoutLink({ className }: { className?: string }) {
  return (
    <form action={signOutToHome}>
      <button
        type="submit"
        className={cn(
          "flex w-full items-center gap-2 rounded-chip px-3 py-2 text-[16px] text-danger transition-colors hover:bg-danger/5",
          className
        )}
      >
        <LogOut className="size-[18px]" strokeWidth={1.8} />
        Logout
      </button>
    </form>
  );
}
