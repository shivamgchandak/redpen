import { ClosingCta } from "./ClosingCta";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { LandingFooter } from "./LandingFooter";
import { LandingNav } from "./LandingNav";
import { ProductPreview } from "./ProductPreview";
import { TrustPoints } from "./TrustPoints";

export function LandingPage({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="rp-canvas min-h-dvh">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-6 px-4 py-4 sm:px-6 lg:gap-10 lg:px-8">
        <LandingNav signedIn={signedIn} />
        <main className="flex flex-col gap-10 lg:gap-14">
          <Hero signedIn={signedIn} />
          <ProductPreview />
          <HowItWorks />
          <TrustPoints />
          <ClosingCta />
        </main>
        <LandingFooter />
      </div>
    </div>
  );
}
