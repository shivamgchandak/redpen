import Image from "next/image";
import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth";
import RedPenLogo from "../../../public/images/RedPenLogo.png";

export function LandingNav({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="flex items-center justify-between gap-3 rounded-panel bg-surface px-3 py-2 sm:px-4">
      <Link href="/" className="flex items-center gap-2" aria-label="RedPen home">
        <Image src={RedPenLogo} alt="" width={36} height={36} priority />
        <span className="text-[22px] font-bold tracking-[-0.04em] text-ink">RedPen</span>
      </Link>

      <nav className="flex items-center gap-1 sm:gap-2">
        <Link
          href="/demo"
          className="rounded-pill px-3 py-2 text-p4 font-medium text-muted transition-colors hover:bg-surface-soft hover:text-ink"
        >
          Try demo
        </Link>

        {signedIn ? (
          <Link
            href="/classes"
            className="flex h-9 items-center rounded-pill bg-[#303030] px-4 text-p4 font-medium text-surface transition-colors hover:bg-[#3A3A3A]"
          >
            My classes
          </Link>
        ) : (
          <GoogleSignInButton size="sm" variant="dark" label="Sign in" />
        )}
      </nav>
    </header>
  );
}
