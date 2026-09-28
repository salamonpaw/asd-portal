import { NextResponse } from "next/server";
import { differenceInCalendarDays } from "date-fns";
import { db } from "@/lib/db";
import { extendProject } from "@/lib/actions/projects";
import { apiUser, PARTNER_ROLES } from "@/lib/authz";
import { loadProjectFor, stripInternal } from "@/lib/project-access";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser(...PARTNER_ROLES);
  if (user instanceof NextResponse) return user;

  const { id } = await params;
  const project = await loadProjectFor(user, id, { partnerOnly: true });
  if (project instanceof NextResponse) return project;

  // Te same warunki co przycisk w UI: wygasły, albo aktywny i wygasa w ciągu 30 dni
  const active = project.status === "ACTIVE" || project.status === "NOPROT";
  const expiringSoon = active && !!project.expiresAt && differenceInCalendarDays(project.expiresAt, new Date()) <= 30;
  if (project.status !== "EXPIRED" && !expiringSoon) {
    return NextResponse.json({ error: "Przedłużenie jest możliwe dla projektu wygasłego lub wygasającego w ciągu 30 dni." }, { status: 409 });
  }

  // Nie przywracaj ochrony, jeśli klienta w międzyczasie zarejestrował inny partner
  const taken = await db.project.findFirst({
    where: { customerTaxId: project.customerTaxId, partnerId: { not: project.partnerId }, status: { in: ["ACTIVE", "NOPROT"] } },
    select: { id: true },
  });
  if (taken) {
    return NextResponse.json({ error: "Klient ma aktywny projekt innego partnera — skontaktuj się z opiekunem ASD." }, { status: 409 });
  }

  const res = await extendProject(id, project.partner.short);
  return NextResponse.json(res.success ? { ...res, data: stripInternal(res.data, user) } : res);
}
