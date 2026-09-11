import Link from "next/link";
import { buttonClass, type ButtonSize, type ButtonVariant } from "./buttonStyles";

// Shared by server and client components; the submit button with a pending state lives in SubmitButton.tsx.
export { SubmitButton } from "./SubmitButton";
export { buttonClass, type ButtonSize, type ButtonVariant } from "./buttonStyles";

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: { variant?: ButtonVariant; size?: ButtonSize } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}
