import "dotenv/config";
import { PrismaClient, Role, PartnerLevel, ProjectStatus, Procurement } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const db = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Reps
  const rep1 = await db.rep.upsert({
    where: { email: "m.kowalczyk@asdsystems.pl" },
    update: {},
    create: { id: "rep-1", name: "Marta Kowalczyk", initials: "MK", email: "m.kowalczyk@asdsystems.pl", region: "Region Centralny" },
  });
  await db.rep.upsert({
    where: { email: "t.zieba@asdsystems.pl" },
    update: {},
    create: { id: "rep-2", name: "Tomasz Zięba", initials: "TZ", email: "t.zieba@asdsystems.pl", region: "Region Południe" },
  });

  // Partners
  const vendmax = await db.partner.upsert({
    where: { id: "p-vendmax" },
    update: {},
    create: {
      id: "p-vendmax", name: "Vendmax Sp. z o.o.", short: "Vendmax",
      city: "Łódź", country: "Polska", level: PartnerLevel.SILVER, discount: 8,
      candidate: false, contact: "Paweł Nowak", email: "p.nowak@vendmax.pl",
      phone: "+48 601 234 567", since: "2023-04", machinesReported: 24, repId: rep1.id,
      markets: { create: [{ name: "Polska" }, { name: "Czechy" }] },
    },
  });

  const automatpro = await db.partner.upsert({
    where: { id: "p-automatpro" },
    update: {},
    create: {
      id: "p-automatpro", name: "AutomatPro s.c.", short: "AutomatPro",
      city: "Katowice", country: "Polska", level: PartnerLevel.GOLD, discount: 12,
      candidate: false, contact: "Iwona Bąk", email: "biuro@automatpro.pl",
      phone: "+48 602 110 220", since: "2021-09", machinesReported: 41, repId: rep1.id,
      markets: { create: [{ name: "Polska" }, { name: "Słowacja" }] },
    },
  });

  const refresh = await db.partner.upsert({
    where: { id: "p-refresh" },
    update: {},
    create: {
      id: "p-refresh", name: "RefreshPoint Sp. z o.o.", short: "RefreshPoint",
      city: "Gdańsk", country: "Polska", level: PartnerLevel.BRONZE, discount: 5,
      candidate: true, contact: "Marek Lis", email: "kontakt@refreshpoint.pl",
      phone: "+48 603 998 100", since: "2025-11", machinesReported: 9, repId: rep1.id,
      markets: { create: [{ name: "Polska" }] },
    },
  });

  // Users
  const hash = await bcrypt.hash("demo1234", 10);

  await db.user.upsert({
    where: { email: "p.nowak@vendmax.pl" },
    update: {},
    create: { email: "p.nowak@vendmax.pl", password: hash, name: "Paweł Nowak", role: Role.PARTNER, partnerId: vendmax.id },
  });
  await db.user.upsert({
    where: { email: "m.kowalczyk@asdsystems.pl" },
    update: {},
    create: { email: "m.kowalczyk@asdsystems.pl", password: hash, name: "Marta Kowalczyk", role: Role.STAFF, repId: rep1.id },
  });
  await db.user.upsert({
    where: { email: "admin@asdsystems.pl" },
    update: {},
    create: { email: "admin@asdsystems.pl", password: hash, name: "Admin ASD", role: Role.ADMIN },
  });

  // Projects
  const projects = [
    {
      id: "ASD-PRJ-2026-0052", partnerId: vendmax.id, repId: rep1.id,
      customerName: "Zakłady Mięsne Kaszub Sp. z o.o.", customerTaxId: "5871122003", customerCountry: "Polska",
      location: "Bydgoszcz", branch: "Zakład produkcyjny nr 2",
      machines: "8–10", procurement: Procurement.BIEZACA, stage: "Negocjacje",
      description: "Klient planuje wymianę 9 starych automatów z napojami i przekąskami w halach produkcyjnych i strefie socjalnej.",
      decisionDate: "2026-07", interested: true, wantsSupport: true,
      support: ["Dobór automatów", "Analiza opłacalności", "Indywidualne warunki handlowe"],
      notes: "Decydent: kierownik administracji. Spotkanie odbyte 14.05.",
      status: ProjectStatus.ACTIVE, protected: true,
      createdAt: new Date("2026-05-22"), acceptedAt: new Date("2026-05-28"), expiresAt: new Date("2026-08-28"),
    },
    {
      id: "ASD-PRJ-2026-0033", partnerId: vendmax.id, repId: rep1.id,
      customerName: "Fabryka Mebli DrewPol S.A.", customerTaxId: "8123344551", customerCountry: "Polska",
      location: "Poznań", branch: "",
      machines: "4–6", procurement: Procurement.BIEZACA, stage: "Oferta",
      description: "Strefa socjalna i biuro — 5 automatów (kawa + przekąski). Klient oczekuje automatu z kawą ziarnistą premium.",
      decisionDate: "2026-06", interested: true, wantsSupport: true,
      support: ["Przygotowanie oferty", "Prezentacja dla klienta"],
      notes: "", status: ProjectStatus.ACTIVE, protected: true,
      createdAt: new Date("2026-03-20"), acceptedAt: new Date("2026-03-25"), expiresAt: new Date("2026-06-25"),
    },
    {
      id: "ASD-PRJ-2026-0051", partnerId: vendmax.id, repId: rep1.id,
      customerName: "Szpital Wojewódzki w Krakowie", customerTaxId: "6751122334", customerCountry: "Polska",
      location: "Kraków", branch: "Pawilon A – hol główny",
      machines: "16+", procurement: Procurement.ZAPYTANIE, stage: "Prezentacja / demo",
      description: "Duży obiekt — automaty w holach, na oddziałach i w strefie dla personelu.",
      decisionDate: "2026-09", interested: true, wantsSupport: true,
      support: ["Udział w spotkaniu z klientem", "Wsparcie techniczne", "Analiza opłacalności"],
      notes: "Wymagane automaty z płatnością BLIK.",
      status: ProjectStatus.VERIFY, protected: false,
      createdAt: new Date("2026-06-01"), acceptedAt: null, expiresAt: null,
    },
    {
      id: "ASD-PRJ-2026-0047", partnerId: vendmax.id, repId: rep1.id,
      customerName: "Quattro Business Park", customerTaxId: "7122339988", customerCountry: "Polska",
      location: "Wrocław", branch: "Budynek C",
      machines: "2–3", procurement: Procurement.BIEZACA, stage: "Rozpoznanie potrzeb",
      description: "Zarządca biurowca pyta o 2 automaty na parterze.",
      decisionDate: "", interested: true, wantsSupport: false, support: [],
      notes: "", status: ProjectStatus.NEEDINFO, protected: false,
      createdAt: new Date("2026-05-30"), acceptedAt: null, expiresAt: null,
    },
    {
      id: "ASD-PRJ-2026-0039", partnerId: vendmax.id, repId: rep1.id,
      customerName: "Politechnika – Dom Studencki Akropol", customerTaxId: "9462233445", customerCountry: "Polska",
      location: "Lublin", branch: "",
      machines: "10–15", procurement: Procurement.PRZETARG, stage: "Oferta",
      description: "Uczelnia ogłosiła przetarg na obsługę automatów w 4 akademikach na 24 miesiące.",
      decisionDate: "2026-08", interested: true, wantsSupport: false, support: [],
      notes: "Ujawniono przetarg po zgłoszeniu – przekwalifikowano.",
      status: ProjectStatus.NOPROT, protected: false,
      createdAt: new Date("2026-04-11"), acceptedAt: new Date("2026-04-15"), expiresAt: new Date("2026-07-15"),
    },
    {
      id: "ASD-PRJ-2026-0018", partnerId: vendmax.id, repId: rep1.id,
      customerName: "Galeria Wisła – CH", customerTaxId: "5223344556", customerCountry: "Polska",
      location: "Warszawa", branch: "",
      machines: "4–6", procurement: Procurement.BIEZACA, stage: "Negocjacje",
      description: "Automaty w strefie food court i przy wejściach bocznych.",
      decisionDate: "", interested: true, wantsSupport: false, support: [], notes: "",
      status: ProjectStatus.EXPIRED, protected: false,
      createdAt: new Date("2026-02-15"), acceptedAt: new Date("2026-02-20"), expiresAt: new Date("2026-05-20"),
    },
    {
      id: "ASD-PRJ-2026-0009", partnerId: vendmax.id, repId: rep1.id,
      customerName: "Sieć Fitness FormaPlus", customerTaxId: "5260011223", customerCountry: "Polska",
      location: "Gdańsk", branch: "12 klubów",
      machines: "16+", procurement: Procurement.BIEZACA, stage: "Decyzja klienta",
      description: "Automaty z napojami izotonicznymi i batonami białkowymi w sieci klubów.",
      decisionDate: "2026-03", interested: true, wantsSupport: true,
      support: ["Indywidualne warunki handlowe", "Materiały marketingowe"],
      notes: "Zamówienie 18 automatów.", status: ProjectStatus.WON, protected: false,
      createdAt: new Date("2026-01-10"), acceptedAt: new Date("2026-01-14"), expiresAt: new Date("2026-04-14"),
    },
    {
      id: "ASD-PRJ-2026-0055", partnerId: refresh.id, repId: rep1.id,
      customerName: "Kaszub Zakład Produkcyjny", customerTaxId: "5871122003", customerCountry: "Polska",
      location: "Bydgoszcz", branch: "",
      machines: "4–6", procurement: Procurement.BIEZACA, stage: "Rozpoznanie potrzeb",
      description: "Klient zainteresowany automatami w nowej hali. Pierwszy kontakt na targach.",
      decisionDate: "", interested: true, wantsSupport: true,
      support: ["Przygotowanie oferty"], notes: "",
      status: ProjectStatus.DUP, protected: false, conflictsWith: "ASD-PRJ-2026-0052",
      createdAt: new Date("2026-06-02"), acceptedAt: null, expiresAt: null,
    },
    {
      id: "ASD-PRJ-2026-0054", partnerId: automatpro.id, repId: rep1.id,
      customerName: "Dworzec PKP Katowice", customerTaxId: "6342211990", customerCountry: "Polska",
      location: "Katowice", branch: "Hala główna + perony",
      machines: "16+", procurement: Procurement.PRZETARG, stage: "Oferta",
      description: "Postępowanie przetargowe na automaty vendingowe na dworcu i peronach.",
      decisionDate: "2026-10", interested: true, wantsSupport: true,
      support: ["Wsparcie techniczne", "Analiza opłacalności"],
      notes: "", status: ProjectStatus.VERIFY, protected: false,
      createdAt: new Date("2026-06-01"), acceptedAt: null, expiresAt: null,
    },
  ];

  for (const p of projects) {
    await db.project.upsert({
      where: { id: p.id },
      update: {},
      create: {
        ...p,
        history: {
          create: [{ who: "System", text: "Zgłoszenie projektu (seed)" }],
        },
      },
    });
  }

  console.log("✅ Seed complete");
  console.log("   Partner:    p.nowak@vendmax.pl / demo1234");
  console.log("   Handlowiec: m.kowalczyk@asdsystems.pl / demo1234");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
