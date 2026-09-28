import { getServerSession, type Session } from "next-auth";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";

export type SessionUser = Session["user"];

export const STAFF_ROLES: Role[] = ["STAFF", "ADMIN"];
export const PARTNER_ROLES: Role[] = ["PARTNER", "PARTNER_ADMIN"];
export const WAREHOUSE_ROLES: Role[] = ["WAREHOUSE_SPECIALIST", "ADMIN"];

/** Błąd, którego treść można bezpiecznie pokazać użytkownikowi. */
export class UserError extends Error {}
export class AuthError extends UserError {
  constructor(message = "Brak dostępu") { super(message); }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

/** Akcje serwera / logika: rzuca AuthError, gdy brak sesji lub roli. */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError("Nie zalogowany");
  if (roles.length && !roles.includes(user.role)) throw new AuthError();
  return user;
}

/** Strony (server components): przekierowuje na /login. */
export async function requirePageRole(...roles: Role[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || (roles.length && !roles.includes(user.role))) redirect("/login");
  return user;
}

/** Endpointy API: zwraca użytkownika albo gotową odpowiedź 401/403. */
export async function apiUser(...roles: Role[]): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (roles.length && !roles.includes(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return user;
}

/** Komunikat błędu bezpieczny do pokazania: nasze UserError wprost, reszta ogólnie (bez szczegółów bazy). */
export function errMsg(e: unknown, fallback = "Wystąpił błąd. Spróbuj ponownie."): string {
  if (e instanceof UserError) return e.message;
  const code = (e as { code?: string })?.code;
  if (code === "P2002") return "Taki rekord już istnieje.";
  if (code === "P2025") return "Nie znaleziono rekordu.";
  console.error("[error]", e);
  return fallback;
}

/** Zakres danych pracownika ASD: handlowiec widzi swoich partnerów/projekty, admin wszystko. */
export function staffScope(user: SessionUser): { repId?: string } {
  if (user.role === "ADMIN") return {};
  if (!user.repId) redirect("/login");
  return { repId: user.repId };
}
