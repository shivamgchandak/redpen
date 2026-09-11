import { cn } from "@/lib/cn";

/** Standard padded column for pages inside the app shell. */
export function PageBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto flex w-full max-w-[1100px] flex-col gap-5 px-3 py-5 sm:px-6 sm:py-8", className)}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="break-words text-[26px] font-bold leading-tight tracking-[-0.04em] text-ink-strong sm:text-[32px]">
          {title}
        </h1>
        {subtitle && <div className="mt-1 text-p4 text-muted">{subtitle}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-card bg-surface p-4 sm:p-5", className)}>{children}</div>;
}

export function Notice({
  tone = "info",
  children,
}: {
  tone?: "info" | "warn" | "danger" | "success";
  children: React.ReactNode;
}) {
  const tones = {
    info: "border-hairline bg-surface text-ink",
    warn: "border-warn/30 bg-warn/5 text-ink",
    danger: "border-danger/30 bg-danger/5 text-danger",
    success: "border-success/30 bg-success/5 text-ink",
  };
  return <div className={cn("rounded-panel border px-4 py-3 text-p4", tones[tone])}>{children}</div>;
}
