import Image from "next/image";
import Link from "next/link";
import RedPenLogo from "../../../public/images/RedPenLogo.png";

/** Centred card filling the page used by login and onboarding. */
export function CenteredCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rp-canvas flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-10">
      <Link href="/" className="flex items-center gap-2" aria-label="RedPen home">
        <Image src={RedPenLogo} alt="" width={40} height={40} priority />
        <span className="text-[26px] font-bold tracking-[-0.04em] text-ink">RedPen</span>
      </Link>

      <div className="flex w-full max-w-[440px] flex-col gap-5 rounded-hero bg-surface p-6 shadow-[0_12px_32px_rgba(24,24,24,0.08)] sm:p-8">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[26px] font-bold leading-tight tracking-[-0.04em] text-ink-strong">
            {title}
          </h1>
          {subtitle && <p className="text-p4 text-muted">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
