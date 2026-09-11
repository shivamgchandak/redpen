"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export function Dialog({
  open,
  onClose,
  title,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "md" | "lg";
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    panelRef.current?.querySelector<HTMLElement>("input, textarea, select")?.focus();
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative flex max-h-[92dvh] w-full ${size === "lg" ? "max-w-[960px]" : "max-w-[520px]"} flex-col gap-4 overflow-y-auto rounded-t-hero bg-surface p-5 shadow-[0_24px_48px_rgba(24,24,24,0.2)] sm:rounded-hero sm:p-6`}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-p1 font-bold text-ink-strong">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-pill text-muted transition-colors hover:bg-surface-soft hover:text-ink"
          >
            <X className="size-5" strokeWidth={1.8} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
