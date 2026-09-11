import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * The part of the auth config that is safe to run in middleware.
 *
 * Middleware runs on the edge runtime, where Mongoose cannot run, so no
 * database code lives here. auth.ts adds the database callbacks on top.
 */

/** Paths that need a teacher who is signed in. Everything else, including the demo, is public. */
export const PROTECTED_PATHS = ["/classes", "/onboarding", "/settings"];

export function isProtected(pathname: string): boolean {
  return PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export const authConfig = {
  // Reads AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET from the environment.
  providers: [Google],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    authorized({ auth, request }) {
      if (!isProtected(request.nextUrl.pathname)) return true;
      return Boolean(auth?.user);
    },
  },
} satisfies NextAuthConfig;
