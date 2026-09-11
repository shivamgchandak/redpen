import { cn } from "@/lib/cn";

export function Field({
  label,
  name,
  error,
  hint,
  className,
  ...input
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = `field-${name}`;
  return (
    <label htmlFor={id} className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-p4 font-medium text-ink">{label}</span>
      <input
        id={id}
        name={name}
        aria-invalid={Boolean(error)}
        className={cn(
          "h-11 w-full rounded-field border bg-surface px-3 text-p3 text-ink outline-none transition-colors placeholder:text-subtle focus:border-brand focus:ring-2 focus:ring-brand/15",
          error ? "border-danger" : "border-hairline"
        )}
        {...input}
      />
      {error ? (
        <span className="text-p5 text-danger">{error}</span>
      ) : hint ? (
        <span className="text-p5 text-subtle">{hint}</span>
      ) : null}
    </label>
  );
}
