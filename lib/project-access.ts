import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PARTNER_ROLES, STAFF_ROLES, type SessionUser } from "@/lib/authz";

/**
 * Wczytuje projekt i sprawdza, czy użytkownik ma do niego dostęp:
 *  - STAFF / ADMIN — każdy projekt (pracownicy ASD)
 *  - PARTNER / PARTNER_ADMIN — tylko projekty własnej firmy
 * Zwraca projekt albo odpowiedź 403/404.
 */
export async function loadProjectFor(user: SessionUser, id: string, opts: { partnerOnly?: boolean; staffOnly?: boolean } = {}) {
  const project = await db.project.findUnique({ where: { id }, include: { partner: true } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isStaff = STAFF_ROLES.includes(user.role);
  const isOwnerPartner = PARTNER_ROLES.includes(user.role) && !!user.partnerId && user.partnerId === project.partnerId;

  if (opts.staffOnly && !isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (opts.partnerOnly && !isOwnerPartner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!isStaff && !isOwnerPartner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return project;
}

/** Usuwa komentarze wewnętrzne ASD z obiektu projektu wysyłanego do partnera. */
export function stripInternal<T extends { comments?: { internal: boolean }[] }>(project: T, user: SessionUser): T {
  if (STAFF_ROLES.includes(user.role) || !project.comments) return project;
  return { ...project, comments: project.comments.filter((c) => !c.internal) };
}
