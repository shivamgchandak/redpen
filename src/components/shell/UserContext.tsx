"use client";

import { createContext, useContext } from "react";
import type { ShellUser } from "./types";

const ShellUserContext = createContext<ShellUser | null>(null);

/** Lets client pages (like the demo) know who is signed in without a fetch. */
export function ShellUserProvider({
  user,
  children,
}: {
  user: ShellUser | null;
  children: React.ReactNode;
}) {
  return <ShellUserContext.Provider value={user}>{children}</ShellUserContext.Provider>;
}

export function useShellUser(): ShellUser | null {
  return useContext(ShellUserContext);
}
