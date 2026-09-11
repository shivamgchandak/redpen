import Link from "next/link";
import { primaryLink } from "./styles";

export function ClosingCta() {
  return (
    <section className="flex flex-col items-center gap-4 rounded-hero bg-ink px-6 py-10 text-center sm:px-10">
      <h2 className="text-[26px] font-bold tracking-[-0.04em] text-surface sm:text-[32px]">
        See it on a real answer sheet
      </h2>
      <p className="max-w-[560px] text-p3 text-surface/70">
        The demo marks a handwritten script of four pages with the tricky cases
        built in: answers out of order, one that crosses a page break, and a
        skipped question.
      </p>
      <Link href="/demo" className={primaryLink}>
        Try the demo
      </Link>
    </section>
  );
}
