import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { connectDB } from "@/server/db/connect";
import { User } from "@/server/db/models";

/**
 * Sessions are JWT cookies, so no session table is needed. The only
 * database work is when signing in: create or update the teacher, then keep
 * their MongoDB id in the token so every request knows who owns what.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,

    signIn({ account, profile }) {
      if (account?.provider !== "google") return false;
      // Google marks unverified addresses; refuse them.
      return Boolean(profile?.email && profile.email_verified !== false);
    },

    async jwt({ token, account, profile }) {
      if (account && profile?.email) {
        await connectDB();
        const picture = typeof profile.picture === "string" ? profile.picture : null;
        const user = await User.findOneAndUpdate(
          { email: profile.email.toLowerCase() },
          {
            $set: {
              name: profile.name ?? "",
              image: picture,
              googleId: account.providerAccountId,
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        if (user) token.userId = String(user._id);
      }
      return token;
    },

    session({ session, token }) {
      if (token.userId) session.user.id = token.userId;
      return session;
    },
  },
});
