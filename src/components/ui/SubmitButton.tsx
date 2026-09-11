"use client";

import { useFormStatus } from "react-dom";
import { buttonClass, type ButtonSize, type ButtonVariant } from "./buttonStyles";

/** A submit button that disables itself and swaps its label while the form is pending. */
export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  size = "md",
  className,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClass(variant, size, className)}>
      {pending ? pendingLabel ?? "Saving..." : children}
    </button>
  );
}

