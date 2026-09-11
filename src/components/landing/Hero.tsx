import Image from "next/image";
import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth";
import { primaryLink, secondaryLink } from "./styles";
import TeacherIllustration from "../../../public/images/AILadyRed.png";

export function Hero({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="grid items-center gap-8 py-8 md:py-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
      <div className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
        <span className="rounded-pill bg-brand/10 px-3 py-1 text-p5 font-semibold text-brand">
          For teachers marking handwritten scripts
        </span>

        <h1 className="text-[34px] font-bold leading-[1.08] tracking-[-0.04em] text-ink-strong sm:text-[46px] lg:text-[56px]">
          Set the paper once. Mark every answer sheet in{" "}
          <span className="text-brand">about a minute.</span>
        </h1>

        <p className="max-w-[560px] text-p3 text-muted sm:text-p2">
          RedPen reads your question paper and rubric, finds each answer on a
          student&apos;s handwritten sheet, boxes it, and marks it with the
          student&apos;s own words as evidence.
        </p>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          {signedIn ? (
            <Link href="/classes" className={primaryLink}>
              Open my classes
            </Link>
          ) : (
            <GoogleSignInButton className="w-full sm:w-auto" />
          )}
          <Link href="/demo" className={secondaryLink}>
            Try the demo without signing in
          </Link>
        </div>

        <p className="text-p5 text-subtle">Works with scanned PDFs and images.</p>
      </div>

      <div className="flex justify-center">
        <Image
          src={TeacherIllustration}
          alt="A teacher holding an open book"
          width={440}
          height={440}
          priority
          className="h-auto w-[240px] sm:w-[320px] lg:w-[440px]"
        />
      </div>
    </section>
  );
}
