import { db } from "@/lib/db";
import { getPartnerEffectiveDiscount } from "@/lib/discount";
import { ProjectStatus, Procurement } from "@prisma/client";

export type NewProjectInput = {
  name: string;
  taxId: string;
  country: string;
  location?: string | null;
  branch?: string | null;
  machines: string;
  procurement: string;
  stage: string;
  description: string;
  decisionDate?: string | null;
  interested: boolean;
  wantsSupport: boolean;
  support?: string[];
  notes?: string | null;
};

function nextId(max: number) {
  return `ASD-PRJ-2026-${String(max + 1).padStart(4, "0")}`;
}

/**
 * Tworzy projekt partnera (status VERIFY lub DUP), z zamrożonym rabatem z dnia zgłoszenia.
 * Wspólne dla formularza partnera i zatwierdzania zgłoszeń od handlowców partnera.
 */
export async function createPartnerProject(opts: {
  partnerId: string;
  input: NewProjectInput;
  salesRepId?: string | null;
  submittedBy?: string; // dopisek do historii, np. "zgłoszenie handlowca Jan Kowalski"
}) {
  const { partnerId, input: body } = opts;

  const partner = await db.partner.findUnique({ where: { id: partnerId }, include: { rep: true } });
  if (!partner) throw new Error("Partner not found");

  // duplikat: aktywny projekt innego partnera z tym samym NIP
  const conflict = await db.project.findFirst({
    where: {
      customerTaxId: body.taxId,
      partnerId: { not: partnerId },
      status: { in: [ProjectStatus.ACTIVE, ProjectStatus.NOPROT] },
    },
  });

  const last = await db.project.findMany({ select: { id: true }, orderBy: { createdAt: "desc" }, take: 100 });
  const maxNum = last.reduce((m, p) => Math.max(m, parseInt(p.id.split("-").pop() ?? "0", 10)), 0);
  const id = nextId(maxNum);

  const isDup = !!conflict;
  const status = isDup ? ProjectStatus.DUP : ProjectStatus.VERIFY;

  // Zamrożenie rabatu z dnia zgłoszenia
  const effective = await getPartnerEffectiveDiscount(partnerId);
  const lockedDiscountPercentage = effective ? Math.round(effective.percentage) : null;

  return db.project.create({
    data: {
      id,
      partnerId,
      repId: partner.repId,
      salesRepId: opts.salesRepId ?? null,
      lockedDiscountPercentage,
      customerName: body.name.trim(),
      customerTaxId: body.taxId,
      customerCountry: body.country,
      location: body.location?.trim() || null,
      branch: body.branch?.trim() || null,
      machines: body.machines,
      procurement: body.procurement as Procurement,
      stage: body.stage,
      description: body.description.trim(),
      decisionDate: body.decisionDate || null,
      interested: body.interested,
      wantsSupport: body.wantsSupport,
      support: body.support ?? [],
      notes: body.notes?.trim() || null,
      status,
      protected: false,
      conflictsWith: conflict?.id ?? null,
      history: {
        create: [
          { who: `Partner · ${partner.short}`, text: opts.submittedBy ? `Zgłoszenie projektu (${opts.submittedBy})` : "Zgłoszenie projektu" },
          isDup
            ? { who: "System", text: "Wykryto aktywny projekt z tym samym NIP – oznaczono jako duplikat" }
            : { who: "System", text: `Przekazano do weryfikacji – Handlowiec ${partner.rep?.name ?? ""}` },
        ],
      },
    },
  });
}
