import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const SESSION_IDLE = 8 * 60 * 60;          // 8 h bez aktywności → wylogowanie
const SESSION_ABSOLUTE = 12 * 60 * 60 * 1000; // max 12 h od zalogowania

// ─── Ochrona przed zgadywaniem haseł (jeden proces → pamięć wystarcza) ───────
// Kluczem jest e-mail, NIE adres IP: bez reverse proxy nagłówki IP da się podrobić.
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;
const fails = new Map<string, { count: number; until: number }>();

function isLocked(email: string) {
  const f = fails.get(email);
  if (!f) return false;
  if (f.until && f.until > Date.now()) return true;
  if (f.until && f.until <= Date.now()) fails.delete(email);
  return false;
}
function recordFail(email: string) {
  const f = fails.get(email) ?? { count: 0, until: 0 };
  f.count += 1;
  if (f.count >= MAX_FAILS) { f.until = Date.now() + LOCK_MS; f.count = 0; }
  fails.set(email, f);
}

// Hash porównywany, gdy konta nie ma — wyrównuje czas odpowiedzi (brak enumeracji kont)
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 10);

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: SESSION_IDLE },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Hasło", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password || password.length > 200) return null;
        if (isLocked(email)) throw new Error("Zbyt wiele nieudanych prób. Spróbuj za 15 minut.");

        const user = await db.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, omit: { password: false } });
        const ok = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
        if (!user || !ok) {
          recordFail(email);
          return null;
        }
        fails.delete(email);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          partnerId: user.partnerId ?? undefined,
          repId: user.repId ?? undefined,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  callbacks: {
    // Wywoływane przy każdym odczycie sesji: dane konta zawsze świeże z bazy.
    // Rzucenie błędu = NextAuth czyści ciasteczko, getServerSession zwraca null.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.sv = user.sessionVersion ?? 0;
        token.loginAt = Date.now();
      }
      if (!token.id) throw new Error("SESSION_INVALID");
      if (!token.loginAt || Date.now() - token.loginAt > SESSION_ABSOLUTE) throw new Error("SESSION_EXPIRED");

      const fresh = await db.user.findUnique({
        where: { id: token.id },
        select: { email: true, name: true, role: true, partnerId: true, repId: true, sessionVersion: true },
      });
      if (!fresh || fresh.sessionVersion !== token.sv) throw new Error("SESSION_REVOKED");

      token.email = fresh.email;
      token.name = fresh.name;
      token.role = fresh.role;
      token.partnerId = fresh.partnerId ?? undefined;
      token.repId = fresh.repId ?? undefined;
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id!,
        email: token.email!,
        name: token.name ?? "",
        role: token.role!,
        partnerId: token.partnerId,
        repId: token.repId,
      };
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Tylko ten sam origin — porównanie całego originu, nie startsWith
      // (startsWith przepuszczał np. http://portal:3310.evil.com)
      if (url.startsWith("/") && !url.startsWith("//")) return `${baseUrl}${url}`;
      try {
        if (new URL(url).origin === new URL(baseUrl).origin) return url;
      } catch {}
      return baseUrl;
    },
  },
};
