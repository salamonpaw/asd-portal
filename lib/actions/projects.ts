import { db } from "@/lib/db";
import { ProjectStatus } from "@prisma/client";
import type { Project } from "@prisma/client";
import { sendProjectAccepted, sendProjectRejected, sendNeedInfo } from "@/lib/email";
import { fmtDate } from "@/lib/dates";
import { PORTAL_URL } from "@/lib/config";
import { ActionResult } from "@/lib/types/actions";

function addMonths(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return d;
}

const INCLUDE_FULL = {
  partner: { include: { markets: true } },
  rep: true,
  history: { orderBy: { date: "asc" as const } },
  comments: { include: { user: true } },
};

// ─── Accept ──────────────────────────────────────────────────────────────────

export async function acceptProject(id: string, repName: string, months: number, discount: number, tender: boolean): Promise<ActionResult<Project & { partner: any; rep: any; history: any[]; comments: any[] }>> {
  const isTender = tender;
  const expiresAt = addMonths(months);
  const now = new Date();
  const projectDiscount = Number.isFinite(discount) ? Math.max(0, Math.min(100, Math.round(discount))) : null;

  const project = await db.project.update({
    where: { id },
    data: {
      status: isTender ? ProjectStatus.NOPROT : ProjectStatus.ACTIVE,
      protected: !isTender,
      discount: isTender ? null : projectDiscount,
      acceptedAt: now,
      expiresAt,
      conflictsWith: null,
      history: {
        create: {
          who: `Handlowiec · ${repName}`,
          text: isTender
            ? `Zaakceptowano jako projekt przetargowy (bez ochrony) – do ${fmtDate(expiresAt)}`
            : `Zaakceptowano – ochrona do ${fmtDate(expiresAt)}${projectDiscount !== null ? `, rabat projektu ${projectDiscount}%` : ""}`,
        },
      },
    },
    include: INCLUDE_FULL,
  });

  // Powiadomienie e-mail do Partnera
  const partnerUser = await db.user.findFirst({ where: { partnerId: project.partnerId } });
  if (partnerUser?.email) {
    sendProjectAccepted({
      to: partnerUser.email,
      partnerContact: project.partner.contact,
      projectId: project.id,
      customerName: project.customerName,
      expiresAt: fmtDate(expiresAt),
      portalUrl: PORTAL_URL,
    }).catch(console.error);
  }

  return { success: true, data: project };
}

// ─── Reject ──────────────────────────────────────────────────────────────────

export async function rejectProject(id: string, repName: string, reason: string): Promise<ActionResult<Project & { partner: any; rep: any; history: any[]; comments: any[] }>> {
  const project = await db.project.update({
    where: { id },
    data: {
      status: ProjectStatus.REJECT,
      history: { create: { who: `Handlowiec · ${repName}`, text: `Odrzucono: ${reason}` } },
    },
    include: INCLUDE_FULL,
  });

  const partnerUser = await db.user.findFirst({ where: { partnerId: project.partnerId } });
  if (partnerUser?.email) {
    sendProjectRejected({
      to: partnerUser.email,
      partnerContact: project.partner.contact,
      projectId: project.id,
      customerName: project.customerName,
      reason,
      portalUrl: PORTAL_URL,
    }).catch(console.error);
  }

  return { success: true, data: project };
}

// ─── Request info ─────────────────────────────────────────────────────────────

export async function requestInfoProject(id: string, repName: string, repId: string, message: string): Promise<ActionResult<Project & { partner: any; rep: any; history: any[]; comments: any[] }>> {
  const userId = await db.user.findFirst({ where: { repId } });
  const project = await db.project.update({
    where: { id },
    data: {
      status: ProjectStatus.NEEDINFO,
      history: { create: { who: `Handlowiec · ${repName}`, text: "Poproszono o uzupełnienie danych" } },
      comments: userId ? { create: { userId: userId.id, text: message, internal: false } } : undefined,
    },
    include: INCLUDE_FULL,
  });

  const partnerUser = await db.user.findFirst({ where: { partnerId: project.partnerId } });
  if (partnerUser?.email) {
    sendNeedInfo({
      to: partnerUser.email,
      partnerContact: project.partner.contact,
      projectId: project.id,
      customerName: project.customerName,
      message,
      portalUrl: PORTAL_URL,
    }).catch(console.error);
  }

  return { success: true, data: project };
}

// ─── Close ────────────────────────────────────────────────────────────────────

export async function closeProject(id: string, repName: string, kind: "won" | "lost"): Promise<ActionResult<Project & { partner: any; rep: any; history: any[]; comments: any[] }>> {
  return { success: true, data: await db.project.update({
    where: { id },
    data: {
      status: kind === "won" ? ProjectStatus.WON : ProjectStatus.LOST,
      protected: false,
      history: { create: { who: `Handlowiec · ${repName}`, text: kind === "won" ? "Zamknięto sukcesem" : "Zamknięto – utracony" } },
    },
    include: INCLUDE_FULL,
  }) };
}

// ─── Extend ───────────────────────────────────────────────────────────────────

export async function extendProject(id: string, partnerShort: string): Promise<ActionResult<Project & { partner: any; rep: any; history: any[]; comments: any[] }>> {
  const project = await db.project.findUnique({ where: { id } });
  if (!project) throw new Error("Not found");
  const isTender = project.procurement === "PRZETARG";
  const expiresAt = addMonths(3);
  return { success: true, data: await db.project.update({
    where: { id },
    data: {
      status: isTender ? ProjectStatus.NOPROT : ProjectStatus.ACTIVE,
      protected: !isTender,
      acceptedAt: new Date(),
      expiresAt,
      history: { create: { who: `Partner · ${partnerShort}`, text: `Zgłoszono kontynuację – ochrona do ${fmtDate(expiresAt)}` } },
    },
    include: INCLUDE_FULL,
  }) };
}

// ─── Deactivate ───────────────────────────────────────────────────────────────

export async function deactivateProject(id: string, partnerShort: string): Promise<ActionResult<Project & { partner: any; rep: any; history: any[]; comments: any[] }>> {
  return { success: true, data: await db.project.update({
    where: { id },
    data: {
      status: ProjectStatus.DEACT,
      protected: false,
      history: { create: { who: `Partner · ${partnerShort}`, text: "Dezaktywowano projekt" } },
    },
    include: INCLUDE_FULL,
  }) };
}

// ─── Comment ──────────────────────────────────────────────────────────────────

export async function addCommentToProject(id: string, userId: string, text: string): Promise<ActionResult<Project & { partner: any; rep: any; history: any[]; comments: any[] }>> {
  return { success: true, data: await db.project.update({
    where: { id },
    data: { comments: { create: { userId, text, internal: true } } },
    include: INCLUDE_FULL,
  }) };
}
