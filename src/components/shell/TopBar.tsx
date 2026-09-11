"use client";

import Image from "next/image";
import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth";
import { ProfileMenu } from "./ProfileMenu";
import type { ShellUser } from "./types";
import RedPenLogo from "../../../public/images/RedPenLogo.png";
import Exams from "../../../public/images/exams.png";
import LeftArrow from "../../../public/images/Arrow_Left.png";
import Menu from "../../../public/images/menu.png";

function BackButton({
  onBack,
  backHref,
  size,
}: {
  onBack?: () => void;
  backHref?: string;
  size: "sm" | "md";
}) {
  const className =
    size === "sm"
      ? "grid size-9 shrink-0 place-items-center rounded-pill text-ink transition-colors hover:bg-surface-soft"
      : "grid size-10 shrink-0 place-items-center rounded-pill text-ink transition-colors hover:bg-surface-soft";
  const icon = <Image src={LeftArrow} alt="" width={24} height={24} />;

  if (backHref) {
    return (
      <Link href={backHref} aria-label="Back" className={className}>
        {icon}
      </Link>
    );
  }
  if (onBack) {
    return (
      <button type="button" aria-label="Back" onClick={onBack} className={className}>
        {icon}
      </button>
    );
  }
  return null;
}

export function TopBar({
  crumb = "",
  onBack,
  backHref,
  onMenu,
  user = null,
}: {
  crumb?: string;
  onBack?: () => void;
  backHref?: string;
  onMenu?: () => void;
  user?: ShellUser | null;
}) {
  return (
    <header className="relative z-20 flex h-14 shrink-0 items-center rounded-panel bg-surface px-3">
      <div className="flex w-full min-w-0 items-center gap-2 lg:hidden">
        <BackButton onBack={onBack} backHref={backHref} size="sm" />
        <Link href={user ? "/classes" : "/"} className="flex min-w-0 items-center gap-2">
          <Image src={RedPenLogo} alt="RedPen logo" width={32} height={32} />
          <span className="truncate text-p3 font-bold text-ink">{crumb || "RedPen"}</span>
        </Link>

        <button
          type="button"
          aria-label="Menu"
          aria-haspopup="dialog"
          onClick={onMenu}
          className="ml-auto grid size-9 shrink-0 place-items-center rounded-pill text-ink transition-colors hover:bg-surface-soft"
        >
          <Image src={Menu} alt="" width={18} height={12} />
        </button>
      </div>

      <div className="hidden w-full items-center gap-2.5 lg:flex">
        <BackButton onBack={onBack} backHref={backHref} size="md" />

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Image src={Exams} alt="" width={20} height={20} />
          <span className="truncate text-p3 text-muted">{crumb}</span>
        </div>

        {user ? (
          <ProfileMenu user={user} />
        ) : (
          <GoogleSignInButton size="sm" variant="dark" label="Sign in" className="shrink-0" />
        )}
      </div>
    </header>
  );
}
