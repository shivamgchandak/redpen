import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "dark" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-gradient text-white shadow-[0_6px_16px_rgba(217,45,58,0.25)] hover:brightness-105",
  dark: "bg-[#303030] text-surface hover:bg-[#3A3A3A]",
  outline: "border border-hairline bg-surface text-ink hover:bg-surface-soft",
  ghost: "text-muted hover:bg-surface-soft hover:text-ink",
  danger: "border border-danger/30 bg-surface text-danger hover:bg-danger/5",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-p4 font-medium",
  md: "h-11 px-5 text-p3 font-semibold",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-pill transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60",
    VARIANT[variant],
    SIZE[size],
    className
  );
}
