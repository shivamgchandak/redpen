"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * While background work is running, fetch the server component again every few
 * seconds. The page reads fresh progress straight from MongoDB, so there is
 * no separate status API to keep in sync.
 */
export function useAutoRefresh(active: boolean, intervalMs = 3000): void {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;
    const tick = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const timer = window.setInterval(tick, intervalMs);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [active, intervalMs, router]);
}

export function isStale(updatedAt: string | null | undefined, afterMs = 8 * 60 * 1000): boolean {
  if (!updatedAt) return true;
  return Date.now() - new Date(updatedAt).getTime() > afterMs;
}

export async function postJson(url: string): Promise<void> {
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
}
