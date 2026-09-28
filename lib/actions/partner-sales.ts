"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { PORTAL_URL } from "@/lib/config";
import { sendMail } from "@/lib/mailer";
import { createPartnerProject } from "@/lib/project-create";
import { parseDays } from "@/lib/reminder-days";
import { tplFormLink, tplRequestDecision } from "@/lib/email-partner";

type Res<T = undefined> = { success: true; data?: T } | { success: false; error: string };

async function requirePartner() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as string | undefined;
  const partnerId = session?.user?.partnerId;
  if (!session || (role !== "PARTNER" && role !== "PARTNER_ADMIN") || !partnerId) {
    throw new Error("Brak dostępu");
  }
  return { partnerId, userName: session.user.name ?? "Partner" };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Handlowcy partnera ───────────────────────────────────────────────────────

export async function saveSalesRep(input: {
  id?: string; name: string; email: string; phone?: string; active?: boolean;
}): Promise<Res> {
  try {
    const { partnerId } = await requirePartner();
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    if (!name) return { success: false, error: "Podaj imię i nazwisko." };
    if (!EMAIL_RE.test(email)) return { success: false, error: "Nieprawidłowy e-mail." };

    const dup = await db.partnerSalesRep.findFirst({
      where: { partnerId, email, ...(input.id ? { id: { not: input.id } } : {}) },
    });
    if (dup) return { success: false, error: "Handlowiec z tym e-mailem już istnieje." };

    const data = { name, email, phone: input.phone?.trim() || null, active: input.active ?? true };
    if (input.id) {
      const { count } = await db.partnerSalesRep.updateMany({ where: { id: input.id, partnerId }, data });
      if (!count) return { success: false, error: "Nie znaleziono handlowca." };
    } else {
      await db.partnerSalesRep.create({ data: { ...data, partnerId } });
    }
    revalidatePath("/partner/sales-reps");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function deleteSalesRep(id: string): Promise<Res> {
  try {
    const { partnerId } = await requirePartner();
    await db.partnerSalesRep.deleteMany({ where: { id, partnerId } });
    revalidatePath("/partner/sales-reps");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function regenerateFormToken(id: string): Promise<Res> {
  try {
    const { partnerId } = await requirePartner();
    const { randomBytes } = await import("crypto");
    await db.partnerSalesRep.updateMany({ where: { id, partnerId }, data: { formToken: randomBytes(18).toString("base64url") } });
    revalidatePath("/partner/sales-reps");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function sendFormLink(id: string): Promise<Res> {
  try {
    const { partnerId } = await requirePartner();
    const rep = await db.partnerSalesRep.findFirst({ where: { id, partnerId }, include: { partner: true } });
    if (!rep) return { success: false, error: "Nie znaleziono handlowca." };
    if (!rep.active) return { success: false, error: "Handlowiec jest nieaktywny." };
    const mail = tplFormLink({ repName: rep.name, partnerName: rep.partner.name, link: `${PORTAL_URL}/r/${rep.formToken}` });
    await sendMail({ partnerId, to: rep.email, ...mail, replyTo: rep.partner.email || undefined });
    return { success: true };
  } catch (e) {
    return { success: false, error: `Nie udało się wysłać: ${(e as Error).message}` };
  }
}

// ─── Zgłoszenia od handlowców ─────────────────────────────────────────────────

export async function approveRequest(id: string, note?: string): Promise<Res<{ projectId: string }>> {
  try {
    const { partnerId, userName } = await requirePartner();
    const req = await db.projectRequest.findFirst({ where: { id, partnerId }, include: { salesRep: true } });
    if (!req) return { success: false, error: "Nie znaleziono zgłoszenia." };
    if (req.status !== "PENDING") return { success: false, error: "Zgłoszenie zostało już rozpatrzone." };

    const ownActive = await db.project.findFirst({
      where: { partnerId, customerTaxId: req.customerTaxId, status: { in: ["ACTIVE", "NOPROT", "VERIFY", "NEW", "NEEDINFO", "DUP"] } },
      select: { id: true },
    });
    if (ownActive) return { success: false, error: `Masz już otwarty projekt na tego klienta (${ownActive.id}).` };

    const project = await createPartnerProject({
      partnerId,
      salesRepId: req.salesRepId,
      submittedBy: `zgłoszenie handlowca ${req.salesRep.name}, zatwierdził ${userName}`,
      input: {
        name: req.customerName, taxId: req.customerTaxId, country: req.customerCountry,
        location: req.location, branch: req.branch, machines: req.machines, procurement: req.procurement,
        stage: req.stage, description: req.description, decisionDate: req.decisionDate,
        interested: req.interested, wantsSupport: req.wantsSupport, support: req.support, notes: req.notes,
      },
    });

    await db.projectRequest.update({
      where: { id },
      data: { status: "APPROVED", partnerNote: note?.trim() || null, projectId: project.id, decidedAt: new Date() },
    });

    const mail = tplRequestDecision({ repName: req.salesRep.name, customerName: req.customerName, approved: true, note, projectId: project.id });
    sendMail({ partnerId, to: req.salesRep.email, ...mail }).catch((e) => console.error("[approveRequest] mail", e));

    revalidatePath("/partner/requests");
    revalidatePath("/partner/projects");
    return { success: true, data: { projectId: project.id } };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function rejectRequest(id: string, note: string): Promise<Res> {
  try {
    const { partnerId } = await requirePartner();
    const req = await db.projectRequest.findFirst({ where: { id, partnerId }, include: { salesRep: true } });
    if (!req) return { success: false, error: "Nie znaleziono zgłoszenia." };
    if (req.status !== "PENDING") return { success: false, error: "Zgłoszenie zostało już rozpatrzone." };
    if (!note?.trim()) return { success: false, error: "Podaj powód odrzucenia." };

    await db.projectRequest.update({
      where: { id },
      data: { status: "REJECTED", partnerNote: note.trim(), decidedAt: new Date() },
    });

    const mail = tplRequestDecision({ repName: req.salesRep.name, customerName: req.customerName, approved: false, note });
    sendMail({ partnerId, to: req.salesRep.email, ...mail }).catch((e) => console.error("[rejectRequest] mail", e));

    revalidatePath("/partner/requests");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ─── Przypomnienia ────────────────────────────────────────────────────────────

export async function saveReminderSettings(input: {
  expiryEnabled: boolean; decisionEnabled: boolean; needInfoEnabled: boolean; pendingRequestEnabled: boolean;
  daysBefore: string; repeatEveryDays: number;
}): Promise<Res> {
  try {
    const { partnerId } = await requirePartner();
    const days = parseDays(input.daysBefore);
    if (!days) return { success: false, error: "Podaj dni przed terminem, np. 30,14,7,1." };
    const repeat = Math.round(input.repeatEveryDays);
    if (!(repeat >= 1 && repeat <= 60)) return { success: false, error: "Powtarzanie: od 1 do 60 dni." };

    const data = {
      expiryEnabled: input.expiryEnabled, decisionEnabled: input.decisionEnabled,
      needInfoEnabled: input.needInfoEnabled, pendingRequestEnabled: input.pendingRequestEnabled,
      daysBefore: days.join(","), repeatEveryDays: repeat,
    };
    await db.reminderSettings.upsert({ where: { partnerId }, create: { partnerId, ...data }, update: data });
    revalidatePath("/partner/settings");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/** Ustawienia projektu po stronie partnera: przypisany handlowiec + nadpisanie rytmu przypomnień. */
export async function updateProjectPartnerSettings(projectId: string, input: {
  salesRepId: string | null; reminderDaysBefore: string | null; remindersMuted: boolean;
}): Promise<Res> {
  try {
    const { partnerId } = await requirePartner();
    const project = await db.project.findFirst({ where: { id: projectId, partnerId }, select: { id: true } });
    if (!project) return { success: false, error: "Nie znaleziono projektu." };

    if (input.salesRepId) {
      const rep = await db.partnerSalesRep.findFirst({ where: { id: input.salesRepId, partnerId } });
      if (!rep) return { success: false, error: "Nieprawidłowy handlowiec." };
    }

    let reminderDaysBefore: string | null = null;
    if (input.reminderDaysBefore?.trim()) {
      const days = parseDays(input.reminderDaysBefore);
      if (!days) return { success: false, error: "Nieprawidłowy rytm, np. 14,7,1." };
      reminderDaysBefore = days.join(",");
    }

    await db.project.update({
      where: { id: projectId },
      data: { salesRepId: input.salesRepId, reminderDaysBefore, remindersMuted: input.remindersMuted },
    });
    revalidatePath(`/partner/projects/${projectId}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
