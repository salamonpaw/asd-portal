import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PORTAL_URL } from "@/lib/config";
import { sendMail, partnerRecipients } from "@/lib/mailer";
import { tplNewRequest } from "@/lib/email-partner";
import { RANGES, STAGES, COUNTRIES, PROCUREMENT, SUPPORT, validTaxId } from "@/lib/constants/project-form";

const str = (v: unknown, max = 2000) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Publiczne przyjęcie zgłoszenia od handlowca partnera (autoryzacja = osobisty token w linku). */
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const rep = await db.partnerSalesRep.findUnique({ where: { formToken: token }, include: { partner: true } });
  if (!rep || !rep.active) {
    return NextResponse.json({ error: "Link jest nieaktywny. Skontaktuj się ze swoim opiekunem." }, { status: 404 });
  }

  const b = await req.json().catch(() => ({}));
  const country = COUNTRIES.includes(str(b.country)) ? str(b.country) : "Polska";
  const taxId = str(b.taxId, 40).replace(/[\s-]/g, "");
  const errors: Record<string, string> = {};

  if (!str(b.name)) errors.name = "Podaj nazwę klienta.";
  if (!validTaxId(country, taxId)) errors.taxId = country === "Polska" ? "NIP musi mieć 10 cyfr." : "Nieprawidłowy Tax ID.";
  if (!RANGES.includes(str(b.machines))) errors.machines = "Wybierz skalę projektu.";
  if (!PROCUREMENT.some((p) => p.id === b.procurement)) errors.procurement = "Wybierz typ postępowania.";
  if (!STAGES.includes(str(b.stage))) errors.stage = "Wybierz etap rozmów.";
  if (!str(b.description)) errors.description = "Opisz potrzebę klienta.";
  if (typeof b.interested !== "boolean") errors.interested = "Wskaż odpowiedź.";
  if (typeof b.wantsSupport !== "boolean") errors.wantsSupport = "Wskaż odpowiedź.";
  const decisionDate = /^\d{4}-\d{2}$/.test(str(b.decisionDate)) ? str(b.decisionDate) : null;

  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });

  // prosta ochrona przed zalaniem: max 20 zgłoszeń / handlowca / dobę
  const recent = await db.projectRequest.count({
    where: { salesRepId: rep.id, createdAt: { gte: new Date(Date.now() - 86400000) } },
  });
  if (recent >= 20) return NextResponse.json({ error: "Limit zgłoszeń na dziś wyczerpany." }, { status: 429 });

  const request = await db.projectRequest.create({
    data: {
      partnerId: rep.partnerId,
      salesRepId: rep.id,
      customerName: str(b.name, 300),
      customerTaxId: taxId,
      customerCountry: country,
      location: str(b.location, 300) || null,
      branch: str(b.branch, 300) || null,
      machines: str(b.machines),
      procurement: b.procurement,
      stage: str(b.stage),
      description: str(b.description, 5000),
      decisionDate,
      interested: b.interested,
      wantsSupport: b.wantsSupport,
      support: Array.isArray(b.support) ? b.support.filter((s: unknown) => SUPPORT.includes(String(s))) : [],
      notes: str(b.notes, 3000) || null,
    },
  });

  // powiadom partnera (nie blokuj odpowiedzi)
  partnerRecipients(rep.partnerId)
    .then((to) => {
      if (!to.length) return;
      const mail = tplNewRequest({
        repName: rep.name, customerName: request.customerName, machines: request.machines,
        description: request.description.slice(0, 400), link: `${PORTAL_URL}/partner/requests`,
      });
      return sendMail({ partnerId: rep.partnerId, to, ...mail, replyTo: rep.email });
    })
    .catch((e) => console.error("[public/requests] notify partner", e));

  return NextResponse.json({ ok: true, id: request.id }, { status: 201 });
}
