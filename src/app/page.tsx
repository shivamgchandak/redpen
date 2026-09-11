import { auth } from "@/auth";
import { LandingPage } from "@/components/landing";

export default async function Home() {
  const session = await auth();
  return <LandingPage signedIn={Boolean(session?.user)} />;
}
