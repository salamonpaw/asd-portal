import type { DefaultSession, DefaultUser } from "next-auth";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      email: string;
      name: string;
      role: Role;
      partnerId?: string;
      repId?: string;
    };
  }

  interface User extends DefaultUser {
    role: Role;
    partnerId?: string;
    repId?: string;
    sessionVersion?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    partnerId?: string;
    repId?: string;
    sv?: number;       // sessionVersion w chwili logowania
    loginAt?: number;  // ms — twardy limit długości sesji
  }
}
