import Link from "next/link";
import { CenteredCard } from "@/components/account/CenteredCard";
import { buttonClass } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <CenteredCard
      title="Page not found"
      subtitle="The link may be old, or this class or test belongs to another account."
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link href="/classes" className={buttonClass("primary", "md", "w-full sm:w-auto")}>
          My classes
        </Link>
        <Link href="/" className={buttonClass("outline", "md", "w-full sm:w-auto")}>
          Home
        </Link>
      </div>
    </CenteredCard>
  );
}
