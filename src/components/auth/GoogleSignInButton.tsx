"use client";

import { useFormStatus } from "react-dom";
import { signInWithGoogle } from "@/app/actions/auth";
import { cn } from "@/lib/cn";

type Variant = "brand" | "dark";
type Size = "md" | "sm";

const VARIANTS: Record<Variant, string> = {
  brand:
    "bg-brand-gradient text-white shadow-[0_6px_16px_rgba(217,45,58,0.28)] hover:brightness-105",
  dark: "bg-[#303030] text-surface shadow-[0_4px_5px_0_#0000001F] hover:bg-[#3A3A3A]",
};

const SIZES: Record<Size, string> = {
  md: "h-12 px-6 text-p3 font-semibold",
  sm: "h-9 px-4 text-p4 font-medium",
};

export function GoogleSignInButton({
  label = "Sign in with Google",
  variant = "brand",
  size = "md",
  className,
  redirectTo = "/classes",
}: {
  label?: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  /** Where to land after signing in with Google. */
  redirectTo?: string;
}) {
  return (
    <form action={signInWithGoogle} className={className}>
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <SubmitButton label={label} variant={variant} size={size} />
    </form>
  );
}

function SubmitButton({
  label,
  variant,
  size,
}: {
  label: string;
  variant: Variant;
  size: Size;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "flex w-full items-center justify-center whitespace-nowrap rounded-pill transition-all active:scale-[0.98] disabled:opacity-70",
        VARIANTS[variant],
        SIZES[size]
      )}
    >
      {pending ? "Opening Google..." : label}
    </button>
  );
}
