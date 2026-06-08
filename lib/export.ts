import * as XLSX from "xlsx";
import type { Project, Partner, Rep } from "@prisma/client";

type ProjectWithRelations = Project & { partner: Partner; rep: Rep };

export function exportProjectsToExcel(
  projects: ProjectWithRelations[],
  filename: string = `Projekty-${new Date().toISOString().split("T")[0]}.xlsx`
) {
  const data = projects.map((p) => ({
    ID: p.id,
    "Kod Projektu": p.id.split("-")[2],
    Klient: p.customerName,
    "NIP / Tax ID": p.customerTaxId,
    Kraj: p.customerCountry,
    Lokalizacja: p.location || "—",
    Oddział: p.branch || "—",
    "Liczba Automatów": p.machines,
    "Typ Postępowania": p.procurement,
    Etap: p.stage,
    "Termin Decyzji": p.decisionDate || "—",
    "Zainteresowanie ASD": p.interested ? "Tak" : "Nie",
    "Wsparcie ASD": p.wantsSupport ? "Tak" : "Nie",
    Opis: p.description,
    Partner: p.partner.short,
    Handlowiec: p.rep.name,
    Status: p.status,
    "Chroniony": p.protected ? "Tak" : "Nie",
    Rabat: p.discount ? `${p.discount}%` : "—",
    "Data Zgłoszenia": p.createdAt.toLocaleDateString("pl-PL"),
    "Data Akceptacji": p.acceptedAt ? p.acceptedAt.toLocaleDateString("pl-PL") : "—",
    "Data Wygaśnięcia": p.expiresAt ? p.expiresAt.toLocaleDateString("pl-PL") : "—",
    Uwagi: p.notes || "—",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Projekty");

  // Autosize columns
  const colWidths = [
    { wch: 12 }, // ID
    { wch: 10 }, // Kod
    { wch: 25 }, // Klient
    { wch: 15 }, // NIP
    { wch: 10 }, // Kraj
    { wch: 20 }, // Lokalizacja
    { wch: 15 }, // Oddział
    { wch: 12 }, // Automaty
    { wch: 15 }, // Postępowanie
    { wch: 15 }, // Etap
    { wch: 12 }, // Termin
    { wch: 10 }, // Zainter.
    { wch: 10 }, // Wsparcie
    { wch: 30 }, // Opis
    { wch: 12 }, // Partner
    { wch: 15 }, // Handlowiec
    { wch: 12 }, // Status
    { wch: 10 }, // Chroniony
    { wch: 8 }, // Rabat
    { wch: 12 }, // Data Zgł.
    { wch: 12 }, // Data Akc.
    { wch: 12 }, // Data Wyg.
    { wch: 20 }, // Uwagi
  ];
  ws["!cols"] = colWidths;

  XLSX.writeFile(wb, filename);
}

export function exportOrdersToExcel(
  orders: any[],
  filename: string = `Zamówienia-${new Date().toISOString().split("T")[0]}.xlsx`
) {
  const data = orders.map((o) => ({
    Kod: o.code,
    Projekt: o.project?.customerName || "—",
    Partner: o.project?.partner?.short || "—",
    Status: o.status,
    "Rep Handlowy": o.supervisorRep?.name || "—",
    "Rep BOK": o.supervisorBok?.name || "—",
    "Data Dostawy": o.deliveryDate ? new Date(o.deliveryDate).toLocaleDateString("pl-PL") : "—",
    "Est. Dni": o.estimatedDays || "—",
    "Na co Czekamy": o.waitingFor?.length ? `${o.waitingFor.length} elementów` : "—",
    "Data Utworzenia": o.createdAt ? new Date(o.createdAt).toLocaleDateString("pl-PL") : "—",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Zamówienia");

  ws["!cols"] = [
    { wch: 15 }, // Kod
    { wch: 25 }, // Projekt
    { wch: 12 }, // Partner
    { wch: 15 }, // Status
    { wch: 15 }, // Rep Hand.
    { wch: 15 }, // Rep BOK
    { wch: 12 }, // Data Dostawy
    { wch: 10 }, // Est. Dni
    { wch: 15 }, // Na co Czekamy
    { wch: 12 }, // Data Utworzenia
  ];

  XLSX.writeFile(wb, filename);
}
