import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Hasło", type: "password" },
      },
      async authorize(credentials): Promise<any> {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;

        const passwordOk = await bcrypt.compare(credentials.password, user.password);
        if (!passwordOk) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          partnerId: user.partnerId || undefined,
          repId: user.repId || undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.email = user.email;
        token.partnerId = user.partnerId;
        token.repId = user.repId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as any;
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        (session.user as any).partnerId = token.partnerId;
        (session.user as any).repId = token.repId;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Role-based redirect after login
      if (url.startsWith(baseUrl)) {
        return url;
      }
      return baseUrl;
    },
  },
};
