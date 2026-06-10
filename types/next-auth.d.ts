import type { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      email: string;
      role: "ADMIN" | "STAFF" | "PARTNER" | "SALES_REP" | "SERVICE_TECHNICIAN" | "WAREHOUSE_SPECIALIST";
      partnerId?: string;
      repId?: string;
    };
  }

  interface User extends DefaultUser {
    role: "ADMIN" | "STAFF" | "PARTNER" | "SALES_REP" | "SERVICE_TECHNICIAN" | "WAREHOUSE_SPECIALIST";
    partnerId?: string;
    repId?: string;
  }
}
