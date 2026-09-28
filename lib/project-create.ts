import { db } from "@/lib/db";
import { getPartnerEffectiveDiscount } from "@/lib/discount";
import { sendProjectSubmitted } from "@/lib/email";
import { PORTAL_URL } from "@/lib/config";
import { UserError } from "@/lib/authz";
import { RANGES, STAGES, COUNTRIES, SUPPORT, validTaxId } from "@/lib/constants/project-form";
import { Procurement, ProjectStatus } from "@prisma/client";

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

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Walidacja danych zgłoszenia (formularz partnera i zgłoszenia handlowców). Rzuca UserError. */
function validateProjectInput(b: NewProjectInput) {
  const country = COUNTRIES.includes(b.country) ? b.country : "Polska";
  const taxId = text(b.taxId, 40).replace(/[\s-]/g, "");
  if (!text(b.name, 300)) throw new UserError("Podaj nazwę klienta.");
  if (!validTaxId(country, taxId)) throw new UserError("Nieprawidłowy NIP / Tax ID.");
  if (!RANGES.includes(b.machines)) throw new UserError("Wybierz skalę projektu.");
  if (!Object.values(Procurement).includes(b.procurement as Procurement)) throw new UserError("Wybierz typ postępowania.");
  if (!STAGES.includes(b.stage)) throw new UserError("Wybierz etap rozmów.");
  if (!text(b.description, 5000)) throw new UserError("Opisz potrzebę klienta.");
  if (typeof b.interested !== "boolean" || typeof b.wantsSupport !== "boolean") throw new UserError("Uzupełnij odpowiedzi Tak/Nie.");
  return {
    customerName: text(b.name, 300),
    customerTaxId: taxId,
    customerCountry: country,
    location: text(b.location, 300) || null,
    branch: text(b.branch, 300) || null,
    machines: b.machines,
    procurement: b.procurement as Procurement,
    stage: b.stage,
    description: text(b.description, 5000),
    decisionDate: /^\d{4}-\d{2}$/.test(b.decisionDate ?? "") ? b.decisionDate! : null,
    interested: b.interested,
    wantsSupport: b.wantsSupport,
    support: Array.isArray(b.support) ? b.support.filter((s) => SUPPORT.includes(s)) : [],
    notes: text(b.notes, 3000) || null,
  };
}

/** Kolejny numer w bieżącym roku, np. ASD-PRJ-2027-0001 */
async function nextProjectId() {
  const prefix = `ASD-PRJ-${new Date().getFullYear()}-`;
  const ids = await db.project.findMany({ where: { id: { startsWith: prefix } }, select: { id: true } });
  const max = ids.reduce((m, p) => Math.max(m, parseInt(p.id.slice(prefix.length), 10) || 0), 0);
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
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
  const data = validateProjectInput(opts.input);

  const partner = await db.partner.findUnique({ where: { id: opts.partnerId }, include: { rep: true } });
  if (!partner) throw new UserError("Nie znaleziono partnera.");

  // duplikat: aktywny projekt innego partnera z tym samym NIP
  const conflict = await db.project.findFirst({
    where: {
      customerTaxId: data.customerTaxId,
      partnerId: { not: partner.id },
      status: { in: [ProjectStatus.ACTIVE, ProjectStatus.NOPROT] },
    },
  });
  const isDup = !!conflict;

  const effective = await getPartnerEffectiveDiscount(partner.id);

  const baseData = {
    ...data,
    partnerId: partner.id,
    repId: partner.repId,
    salesRepId: opts.salesRepId ?? null,
    lockedDiscountPercentage: effective ? Math.round(effective.percentage) : null, // zamrożony rabat z dnia zgłoszenia
    status: isDup ? ProjectStatus.DUP : ProjectStatus.VERIFY,
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
  };

  // Dwa zgłoszenia w tej samej chwili mogą dostać ten sam numer — wtedy ponawiamy
  let project;
  for (let attempt = 0; !project; attempt++) {
    try {
      project = await db.project.create({ data: { id: await nextProjectId(), ...baseData } });
    } catch (e) {
      if ((e as { code?: string }).code !== "P2002" || attempt >= 4) throw e;
    }
  }

  if (partner.rep?.email) {
    sendProjectSubmitted({
      to: partner.rep.email, repName: partner.rep.name, partnerName: partner.name,
      projectId: project.id, customerName: project.customerName, customerTaxId: project.customerTaxId, portalUrl: PORTAL_URL,
    }).catch((e) => console.error("[createPartnerProject] mail", e));
  }

  return project;
}
