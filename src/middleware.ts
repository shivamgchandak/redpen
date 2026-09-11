import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Guests to a protected page are sent to sign in, then back.
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/classes/:path*", "/onboarding", "/settings"],
};
