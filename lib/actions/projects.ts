import { db } from "@/lib/db";
import { ProjectStatus } from "@prisma/client";

function addMonths(date: Date, n: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

const TODAY = new Date("2026-06-03");

export async function acceptProject(id: string, repName: string, months: number, discount: number, tender: boolean) {
  const isTender = tender;
  const expiresAt = addMonths(TODAY, months);
  return db.project.update({
    where: { id },
    data: {
      status: isTender ? ProjectStatus.NOPROT : ProjectStatus.ACTIVE,
      protected: !isTender,
      acceptedAt: TODAY,
      expiresAt,
      conflictsWith: null,
      history: {
        create: {
          who: `Handlowiec · ${repName}`,
          text: isTender
            ? `Zaakceptowano jako projekt przetargowy (bez ochrony) – do ${expiresAt.toLocaleDateString("pl-PL")}`
            : `Zaakceptowano – ochrona do ${expiresAt.toLocaleDateString("pl-PL")}`,
        },
      },
    },
    include: { partner: { include: { markets: true } }, rep: true, history: { orderBy: { date: "asc" } }, comments: { include: { user: true } } },
  });
}

export async function rejectProject(id: string, repName: string, reason: string) {
  return db.project.update({
    where: { id },
    data: {
      status: ProjectStatus.REJECT,
      history: { create: { who: `Handlowiec · ${repName}`, text: `Odrzucono: ${reason}` } },
    },
    include: { partner: { include: { markets: true } }, rep: true, history: { orderBy: { date: "asc" } }, comments: { include: { user: true } } },
  });
}

export async function requestInfoProject(id: string, repName: string, repId: string, message: string) {
  const userId = await db.user.findFirst({ where: { repId } });
  return db.project.update({
    where: { id },
    data: {
      status: ProjectStatus.NEEDINFO,
      history: { create: { who: `Handlowiec · ${repName}`, text: "Poproszono o uzupełnienie danych" } },
      comments: userId ? { create: { userId: userId.id, text: message, internal: false } } : undefined,
    },
    include: { partner: { include: { markets: true } }, rep: true, history: { orderBy: { date: "asc" } }, comments: { include: { user: true } } },
  });
}

export async function closeProject(id: string, repName: string, kind: "won" | "lost") {
  return db.project.update({
    where: { id },
    data: {
      status: kind === "won" ? ProjectStatus.WON : ProjectStatus.LOST,
      protected: false,
      history: { create: { who: `Handlowiec · ${repName}`, text: kind === "won" ? "Zamknięto sukcesem" : "Zamknięto – utracony" } },
    },
    include: { partner: { include: { markets: true } }, rep: true, history: { orderBy: { date: "asc" } }, comments: { include: { user: true } } },
  });
}

export async function extendProject(id: string, partnerShort: string) {
  const project = await db.project.findUnique({ where: { id } });
  if (!project) throw new Error("Not found");
  const isTender = project.procurement === "PRZETARG";
  const expiresAt = addMonths(TODAY, 3);
  return db.project.update({
    where: { id },
    data: {
      status: isTender ? ProjectStatus.NOPROT : ProjectStatus.ACTIVE,
      protected: !isTender,
      acceptedAt: TODAY,
      expiresAt,
      history: { create: { who: `Partner · ${partnerShort}`, text: `Zgłoszono kontynuację – ochrona do ${expiresAt.toLocaleDateString("pl-PL")}` } },
    },
    include: { partner: { include: { markets: true } }, rep: true, history: { orderBy: { date: "asc" } }, comments: { include: { user: true } } },
  });
}

export async function deactivateProject(id: string, partnerShort: string) {
  return db.project.update({
    where: { id },
    data: {
      status: ProjectStatus.DEACT,
      protected: false,
      history: { create: { who: `Partner · ${partnerShort}`, text: "Dezaktywowano projekt" } },
    },
    include: { partner: { include: { markets: true } }, rep: true, history: { orderBy: { date: "asc" } }, comments: { include: { user: true } } },
  });
}

export async function addCommentToProject(id: string, userId: string, text: string, repName: string) {
  return db.project.update({
    where: { id },
    data: {
      comments: { create: { userId, text, internal: true } },
    },
    include: { partner: { include: { markets: true } }, rep: true, history: { orderBy: { date: "asc" } }, comments: { include: { user: true } } },
  });
}
