/** The current teacher as the shell shows them. null means guest (demo). */
export interface ShellUser {
  name: string;
  email?: string | null;
}
