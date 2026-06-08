import "dotenv/config";
import { PrismaClient, Role, PartnerLevel, ProjectStatus, Procurement } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const db = new PrismaClient({ adapter });

// ─── Default content items ────────────────────────────────────────────────────
const DEFAULT_CONTENT: Array<{ key: string; value: string; label: string; group: string }> = [
  // Portal — ogólne
  { key: "portal.tagline", value: "Zgłaszaj projekty i zabezpiecz swoją relację z klientem", label: "Tagline portalu", group: "Portal" },
  { key: "portal.description", value: "Rejestr Projektów Partnerskich ASD Systems – zarządzaj projektami wdrożeń automatów wydających i chroń swoje relacje z klientami.", label: "Opis portalu", group: "Portal" },
  { key: "portal.protection.description", value: "Rejestrujesz klienta końcowego po NIP / Tax ID, a ASD Systems gwarantuje, że jeśli ten klient zgłosi się bezpośrednio do nas – przekierujemy go do Ciebie.", label: "Opis ochrony projektu", group: "Portal" },

  // Formularz nowego projektu
  { key: "form.customer.placeholder", value: "np. ABB Sp. z o.o., Volkswagen Poznań, IKEA Distribution", label: "Placeholder: nazwa klienta", group: "Formularz zgłoszenia" },
  { key: "form.description.placeholder", value: "Czego potrzebuje klient – rodzaj artykułów (BHP/MRO/narzędzia), liczba punktów wydawania, lokalizacja zakładów, wymagania dot. kontroli dostępu…", label: "Placeholder: opis potrzeby", group: "Formularz zgłoszenia" },
  { key: "form.notes.placeholder", value: "Dodatkowe informacje dla Handlowca ASD – np. decydent, etap rozmów, warunki przetargu…", label: "Placeholder: uwagi Partnera", group: "Formularz zgłoszenia" },
  { key: "form.branch.placeholder", value: "np. Zakład produkcyjny nr 2, Hala montażowa, Magazyn centralny", label: "Placeholder: oddział/lokalizacja", group: "Formularz zgłoszenia" },

  // Zakres wsparcia
  { key: "support.items", value: "Przygotowanie oferty,Udział w spotkaniu z klientem,Wsparcie techniczne,Wsparcie produktowe,Dobór modelu automatu,Analiza oszczędności,Materiały marketingowe,Prezentacja dla klienta,Indywidualne warunki handlowe", label: "Lista opcji wsparcia (przecinkami)", group: "Formularz zgłoszenia" },

  // E-mail powiadomienia
  { key: "email.from_name", value: "ASD Systems – Partner Portal", label: "Nazwa nadawcy e-maili", group: "E-mail" },
  { key: "email.footer", value: "ASD Systems Sp. z o.o. | asdsystems.eu | Partner Portal", label: "Stopka e-maili", group: "E-mail" },

  // Landing page
  { key: "landing.hero.title", value: "Zgłaszaj projekty i zabezpiecz swoją relację z klientem", label: "Tytuł hero", group: "Landing page" },
  { key: "landing.hero.subtitle", value: "Rejestrujesz klienta końcowego po NIP / Tax ID, a ASD Systems gwarantuje, że jeśli ten klient zgłosi się bezpośrednio do nas – przekierujemy go do Ciebie.", label: "Podtytuł hero", group: "Landing page" },
  { key: "landing.benefits.title", value: "Co daje zaakceptowane zgłoszenie", label: "Tytuł sekcji korzyści", group: "Landing page" },

  // ASD Systems — Produkty
  { key: "asd.bhp.title", value: "Środki Bezpieczeństwa i Higieny Pracy", label: "Tytuł sekcji BHP", group: "ASD Systems — Oferta" },
  { key: "asd.bhp.description", value: "Automaty wydające do zarządzania rękawicami ochronnymi, goggles, nausznikami, maskami i innymi środkami BHP. Pełna kontrola pobrań per pracownik, raportowanie do systemu ZSZT.", label: "Opis BHP", group: "ASD Systems — Oferta" },

  { key: "asd.mro.title", value: "Części Zamienne i Materiały MRO", label: "Tytuł sekcji MRO", group: "ASD Systems — Oferta" },
  { key: "asd.mro.description", value: "Systemy automatyczne do wydawania części zamiennych, materiałów konserwacyjnych i usługowych. Zarządzanie stanem magazynu, śledzenie zużycia, integracja z systemami ERP.", label: "Opis MRO", group: "ASD Systems — Oferta" },

  { key: "asd.tools.title", value: "Narzędzia i Sprzęt", label: "Tytuł sekcji narzędzia", group: "ASD Systems — Oferta" },
  { key: "asd.tools.description", value: "Automaty do wydawania narzędzi precyzyjnych, sprzętu pomiarowego i testowego. Sprawdzenie dostępności, rezerwacja, śledzenie wypożyczeń, integracja z systemami logistyki.", label: "Opis narzędzi", group: "ASD Systems — Oferta" },

  // ASD Systems — Korzyści
  { key: "asd.benefits.control", value: "Pełna kontrola dostępu i pobrań — każdy pracownik identyfikowany przez kartę RFID, wszystkie operacje rejestrowane.", label: "Korzyść: Kontrola", group: "ASD Systems — Korzyści" },
  { key: "asd.benefits.efficiency", value: "Zwiększenie wydajności — brak kolejek, automatyczne wydawanie, redukcja czasu postoju maszyn.", label: "Korzyść: Wydajność", group: "ASD Systems — Korzyści" },
  { key: "asd.benefits.inventory", value: "Zarządzanie zapasami — monitoring stanu magazynu w czasie rzeczywistym, automatyczne powiadomienia o niedoborach.", label: "Korzyść: Magazyn", group: "ASD Systems — Korzyści" },
  { key: "asd.benefits.analytics", value: "Analityka i raporty — zużycie per działów, trendy, optymalizacja kosztów, wsparcie decyzji inwestycyjnych.", label: "Korzyść: Analityka", group: "ASD Systems — Korzyści" },

  // ASD Systems — Kluczowe info
  { key: "asd.machines.types", value: "D810neo,D820 Compact,D920,D920 XL,Medicamat 300,Medicamat 500", label: "Modele automatów", group: "ASD Systems — Maszyny" },
  { key: "asd.integration", value: "Integracja z systemami: SAP, Oracle, Microsoft Dynamics, systemami SZZT, platformami MES.", label: "Integracje", group: "ASD Systems — Maszyny" },
  { key: "asd.support", value: "Serwis: instalacja, konfiguracja, szkolenie operatorów, wsparcie techniczne 24/7, części zamienne.", label: "Wsparcie i serwis", group: "ASD Systems — Maszyny" },

  // Projektu — kraje
  { key: "project.countries", value: "Polska,Czechy,Słowacja,Niemcy,Austria,Litwa,Kanada", label: "Lista krajów (przecinkami)", group: "Projekt — opcje" },

  // Projektu — etapy
  { key: "project.stages", value: "Rozpoznanie potrzeb,Prezentacja / demo,Oferta,Negocjacje,Decyzja klienta", label: "Lista etapów (przecinkami)", group: "Projekt — opcje" },

  // Projektu — zakresy
  { key: "project.ranges", value: "1,2–3,4–6,8–10,10–15,16+,Nie wiem / do ustalenia", label: "Szacowana liczba automatów (przecinkami)", group: "Projekt — opcje" },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Reps
  const rep1 = await db.rep.upsert({
    where: { email: "m.kowalczyk@asdsystems.pl" },
    update: {},
    create: {
      id: "rep-1",
      name: "Marta Kowalczyk",
      initials: "MK",
      email: "m.kowalczyk@asdsystems.pl",
      region: "Region Centralny",
      phone: "+48 500 000 001",
    },
  });

  await db.rep.upsert({
    where: { email: "t.zieba@asdsystems.pl" },
    update: {},
    create: {
      id: "rep-2",
      name: "Tomasz Zięba",
      initials: "TZ",
      email: "t.zieba@asdsystems.pl",
      region: "Region Południe",
      phone: "+48 500 000 002",
    },
  });

  // Partners
  const vendmax = await db.partner.upsert({
    where: { id: "p-vendmax" },
    update: {},
    create: {
      id: "p-vendmax",
      name: "Vendmax Sp. z o.o.",
      short: "Vendmax",
      city: "Łódź",
      country: "Polska",
      level: PartnerLevel.SILVER,
      discount: 8,
      candidate: false,
      contact: "Paweł Nowak",
      email: "p.nowak@vendmax.pl",
      phone: "+48 601 234 567",
      since: "2023-04",
      machinesReported: 24,
      repId: rep1.id,
      markets: { create: [{ name: "Polska" }, { name: "Czechy" }] },
    },
  });

  const automatpro = await db.partner.upsert({
    where: { id: "p-automatpro" },
    update: {},
    create: {
      id: "p-automatpro",
      name: "AutomatPro s.c.",
      short: "AutomatPro",
      city: "Katowice",
      country: "Polska",
      level: PartnerLevel.GOLD,
      discount: 12,
      candidate: false,
      contact: "Iwona Bąk",
      email: "biuro@automatpro.pl",
      phone: "+48 602 110 220",
      since: "2021-09",
      machinesReported: 41,
      repId: rep1.id,
      markets: { create: [{ name: "Polska" }, { name: "Słowacja" }] },
    },
  });

  const refresh = await db.partner.upsert({
    where: { id: "p-refresh" },
    update: {},
    create: {
      id: "p-refresh",
      name: "RefreshPoint Sp. z o.o.",
      short: "RefreshPoint",
      city: "Gdańsk",
      country: "Polska",
      level: PartnerLevel.BRONZE,
      discount: 5,
      candidate: true,
      contact: "Marek Lis",
      email: "kontakt@refreshpoint.pl",
      phone: "+48 603 998 100",
      since: "2025-11",
      machinesReported: 9,
      repId: rep1.id,
      markets: { create: [{ name: "Polska" }] },
    },
  });

  // Users
  const hash = await bcrypt.hash("demo1234", 10);
  const adminHash = await bcrypt.hash("TymczasoweHaslo", 10);

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
  // Konto dla Pawła Salamona
  await db.user.upsert({
    where: { email: "p.salamon@asdsystems.pl" },
    update: { password: adminHash },
    create: { email: "p.salamon@asdsystems.pl", password: adminHash, name: "Paweł Salamon", role: Role.ADMIN },
  });

  // Projects — zaktualizowane opisy BHP/MRO
  const projects = [
    {
      id: "ASD-PRJ-2026-0052",
      partnerId: vendmax.id,
      repId: rep1.id,
      customerName: "Volkswagen Poznań Sp. z o.o.",
      customerTaxId: "5871122003",
      customerCountry: "Polska",
      location: "Poznań",
      branch: "Hala produkcyjna A – montaż",
      machines: "8–10",
      procurement: Procurement.BIEZACA,
      stage: "Negocjacje",
      description:
        "Klient planuje wdrożenie 9 automatów D810neo do wydawania środków BHP (rękawice, okulary ochronne, nauszniki) oraz MRO w halach produkcyjnych. Wymagana pełna kontrola pobrań per pracownik i integracja z systemem kadrowym.",
      decisionDate: "2026-07",
      interested: true,
      wantsSupport: true,
      support: ["Dobór modelu automatu", "Analiza oszczędności", "Indywidualne warunki handlowe"],
      notes: "Decydent: kierownik BHP. Spotkanie demonstracyjne odbyte 14.05.",
      status: ProjectStatus.ACTIVE,
      protected: true,
      createdAt: new Date("2026-05-22"),
      acceptedAt: new Date("2026-05-28"),
      expiresAt: new Date("2026-08-28"),
    },
    {
      id: "ASD-PRJ-2026-0033",
      partnerId: vendmax.id,
      repId: rep1.id,
      customerName: "ABB Sp. z o.o.",
      customerTaxId: "8123344551",
      customerCountry: "Polska",
      location: "Kraków",
      branch: "Zakład Transformatorów",
      machines: "4–6",
      procurement: Procurement.BIEZACA,
      stage: "Oferta",
      description:
        "Zakład transformatorów – 5 automatów do wydawania narzędzi precyzyjnych i środków BHP. Klient oczekuje rozwiązania z czytnikiem kart RFID i pełnym raportem pobrań.",
      decisionDate: "2026-06",
      interested: true,
      wantsSupport: true,
      support: ["Przygotowanie oferty", "Prezentacja dla klienta"],
      notes: "",
      status: ProjectStatus.ACTIVE,
      protected: true,
      createdAt: new Date("2026-03-20"),
      acceptedAt: new Date("2026-03-25"),
      expiresAt: new Date("2026-06-25"),
    },
    {
      id: "ASD-PRJ-2026-0051",
      partnerId: vendmax.id,
      repId: rep1.id,
      customerName: "IKEA Industry Poland Sp. z o.o.",
      customerTaxId: "6751122334",
      customerCountry: "Polska",
      location: "Lubawa",
      branch: "Fabryka mebli – Wydział meblowy",
      machines: "16+",
      procurement: Procurement.ZAPYTANIE,
      stage: "Prezentacja / demo",
      description:
        "Duży zakład produkcyjny – automaty do wydawania środków BHP i narzędzi na wielu wydziałach. Klient zbiera oferty od kilku dostawców. Wymagana integracja z SAP.",
      decisionDate: "2026-09",
      interested: true,
      wantsSupport: true,
      support: ["Udział w spotkaniu z klientem", "Wsparcie techniczne", "Analiza oszczędności"],
      notes: "Wymagana integracja z SAP Plant Maintenance.",
      status: ProjectStatus.VERIFY,
      protected: false,
      createdAt: new Date("2026-06-01"),
      acceptedAt: null,
      expiresAt: null,
    },
    {
      id: "ASD-PRJ-2026-0047",
      partnerId: vendmax.id,
      repId: rep1.id,
      customerName: "Solaris Bus & Coach S.A.",
      customerTaxId: "7122339988",
      customerCountry: "Polska",
      location: "Bolechowo",
      branch: "Hala produkcyjna nr 3",
      machines: "2–3",
      procurement: Procurement.BIEZACA,
      stage: "Rozpoznanie potrzeb",
      description:
        "Producent autobusów – wstępne zapytanie o automaty do wydawania narzędzi warsztatowych na linii montażu.",
      decisionDate: "",
      interested: true,
      wantsSupport: false,
      support: [],
      notes: "",
      status: ProjectStatus.NEEDINFO,
      protected: false,
      createdAt: new Date("2026-05-30"),
      acceptedAt: null,
      expiresAt: null,
    },
    {
      id: "ASD-PRJ-2026-0039",
      partnerId: vendmax.id,
      repId: rep1.id,
      customerName: "Politechnika Poznańska",
      customerTaxId: "9462233445",
      customerCountry: "Polska",
      location: "Poznań",
      branch: "Wydział Mechaniczny",
      machines: "10–15",
      procurement: Procurement.PRZETARG,
      stage: "Oferta",
      description:
        "Uczelnia techniczna ogłosiła przetarg na automaty do wydawania materiałów i narzędzi do ćwiczeń laboratoryjnych na 5 wydziałach.",
      decisionDate: "2026-08",
      interested: true,
      wantsSupport: false,
      support: [],
      notes: "Przetarg publiczny – dokumentacja na platformie e-zamówienia.",
      status: ProjectStatus.NOPROT,
      protected: false,
      createdAt: new Date("2026-04-11"),
      acceptedAt: new Date("2026-04-15"),
      expiresAt: new Date("2026-07-15"),
    },
    {
      id: "ASD-PRJ-2026-0018",
      partnerId: vendmax.id,
      repId: rep1.id,
      customerName: "Scania Production Słupsk Sp. z o.o.",
      customerTaxId: "5223344556",
      customerCountry: "Polska",
      location: "Słupsk",
      branch: "",
      machines: "4–6",
      procurement: Procurement.BIEZACA,
      stage: "Negocjacje",
      description:
        "Zakład produkcji silników – automaty do wydawania środków BHP i MRO dla pracowników zmianowych.",
      decisionDate: "",
      interested: true,
      wantsSupport: false,
      support: [],
      notes: "",
      status: ProjectStatus.EXPIRED,
      protected: false,
      createdAt: new Date("2026-02-15"),
      acceptedAt: new Date("2026-02-20"),
      expiresAt: new Date("2026-05-20"),
    },
    {
      id: "ASD-PRJ-2026-0009",
      partnerId: vendmax.id,
      repId: rep1.id,
      customerName: "Siemens Manufacturing Sp. z o.o.",
      customerTaxId: "5260011223",
      customerCountry: "Polska",
      location: "Wrocław",
      branch: "Zakład elektryczny – 12 hal",
      machines: "16+",
      procurement: Procurement.BIEZACA,
      stage: "Decyzja klienta",
      description:
        "Wdrożenie systemu automatów D1080neo do wydawania środków ochrony indywidualnej i narzędzi elektrycznych we wszystkich halach produkcyjnych.",
      decisionDate: "2026-03",
      interested: true,
      wantsSupport: true,
      support: ["Indywidualne warunki handlowe", "Materiały marketingowe"],
      notes: "Zamówienie 18 automatów. Kontrakt wieloletni.",
      status: ProjectStatus.WON,
      protected: false,
      createdAt: new Date("2026-01-10"),
      acceptedAt: new Date("2026-01-14"),
      expiresAt: new Date("2026-04-14"),
    },
    {
      id: "ASD-PRJ-2026-0055",
      partnerId: refresh.id,
      repId: rep1.id,
      customerName: "Volkswagen Poznań Sp. z o.o.",
      customerTaxId: "5871122003",
      customerCountry: "Polska",
      location: "Poznań",
      branch: "Hala lakierni",
      machines: "4–6",
      procurement: Procurement.BIEZACA,
      stage: "Rozpoznanie potrzeb",
      description:
        "Lakiernia – dodatkowe automaty do wydawania odzieży roboczej i środków lakierniczych BHP.",
      decisionDate: "",
      interested: true,
      wantsSupport: true,
      support: ["Przygotowanie oferty"],
      notes: "",
      status: ProjectStatus.DUP,
      protected: false,
      conflictsWith: "ASD-PRJ-2026-0052",
      createdAt: new Date("2026-06-02"),
      acceptedAt: null,
      expiresAt: null,
    },
    {
      id: "ASD-PRJ-2026-0054",
      partnerId: automatpro.id,
      repId: rep1.id,
      customerName: "PKN ORLEN S.A.",
      customerTaxId: "6342211990",
      customerCountry: "Polska",
      location: "Płock",
      branch: "Rafineria – Dział Utrzymania Ruchu",
      machines: "16+",
      procurement: Procurement.PRZETARG,
      stage: "Oferta",
      description:
        "Przetarg na dostawę automatów wydających do zarządzania częściami zamiennymi MRO i środkami BHP w rafinerii.",
      decisionDate: "2026-10",
      interested: true,
      wantsSupport: true,
      support: ["Wsparcie techniczne", "Analiza oszczędności"],
      notes: "",
      status: ProjectStatus.VERIFY,
      protected: false,
      createdAt: new Date("2026-06-01"),
      acceptedAt: null,
      expiresAt: null,
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

  // Content items
  for (const item of DEFAULT_CONTENT) {
    await db.contentItem.upsert({
      where: { key: item.key },
      update: {},
      create: item,
    });
  }

  console.log("✅ Seed complete");
  console.log("   Partner:       p.nowak@vendmax.pl / demo1234");
  console.log("   Handlowiec:    m.kowalczyk@asdsystems.pl / demo1234");
  console.log("   Admin (demo):  admin@asdsystems.pl / demo1234");
  console.log("   Admin (Pawel): p.salamon@asdsystems.pl / TymczasoweHaslo");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
