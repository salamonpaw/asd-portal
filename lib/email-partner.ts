import { base, esc } from "@/lib/email";

export { esc };

const fmt = (d: Date) => d.toLocaleDateString("pl-PL");

export function tplFormLink(o: { repName: string; partnerName: string; link: string }) {
  return {
    subject: `Twój formularz zgłoszeń projektów — ${o.partnerName}`,
    html: base(`
      <h1>Cześć ${esc(o.repName)}!</h1>
      <p><b>${esc(o.partnerName)}</b> udostępnia Ci formularz do zgłaszania zapotrzebowań na projekty.
      Wypełnij go, gdy masz nowego klienta — zgłoszenie trafi do Twojego opiekuna do zatwierdzenia.</p>
      <a class="btn" href="${esc(o.link)}">Otwórz formularz zgłoszenia</a>
      <p style="font-size:13px">To Twój osobisty link — zachowaj go, np. w zakładkach. Nie wymaga logowania.<br>
      <span style="color:#9AA0AB">${esc(o.link)}</span></p>
    `),
  };
}

export function tplNewRequest(o: { repName: string; customerName: string; machines: string; description: string; link: string }) {
  return {
    subject: `🆕 Nowe zgłoszenie od handlowca — ${o.customerName}`,
    html: base(`
      <h1>Nowe zgłoszenie do zatwierdzenia</h1>
      <p>Handlowiec <b>${esc(o.repName)}</b> zgłosił zapotrzebowanie na projekt.</p>
      <div class="meta">
        <b>Klient:</b> ${esc(o.customerName)}<br>
        <b>Automaty:</b> ${esc(o.machines)}<br>
        <b>Opis:</b> ${esc(o.description)}
      </div>
      <a class="btn" href="${esc(o.link)}">Przejrzyj i zatwierdź</a>
    `),
  };
}

export function tplRequestDecision(o: { repName: string; customerName: string; approved: boolean; note?: string | null; projectId?: string | null }) {
  return {
    subject: o.approved ? `✅ Zgłoszenie zatwierdzone — ${o.customerName}` : `Zgłoszenie odrzucone — ${o.customerName}`,
    html: base(`
      <h1>${o.approved ? "Zgłoszenie zatwierdzone" : "Zgłoszenie odrzucone"}</h1>
      <p>Cześć ${esc(o.repName)}, Twoje zgłoszenie dla klienta <b>${esc(o.customerName)}</b>
      ${o.approved ? `zostało zatwierdzone i przekazane do ASD Systems${o.projectId ? ` (nr <b>${esc(o.projectId)}</b>)` : ""}.` : "nie zostało zatwierdzone."}</p>
      ${o.note ? `<div class="meta"><b>Komentarz opiekuna:</b> ${esc(o.note)}</div>` : ""}
    `),
  };
}

export function tplDeadline(o: {
  kind: "EXPIRY" | "DECISION"; recipientName?: string | null; projectId: string;
  customerName: string; date: Date; daysLeft: number; link?: string;
}) {
  const what = o.kind === "EXPIRY" ? "Ochrona projektu wygasa" : "Zbliża się planowany termin decyzji klienta";
  const when = o.daysLeft <= 0 ? "dziś" : o.daysLeft === 1 ? "jutro" : `za ${o.daysLeft} dni`;
  return {
    subject: `⏰ ${what} ${when} — ${o.customerName}`,
    html: base(`
      <h1>${what} ${when}</h1>
      <p>${o.recipientName ? `Cześć ${esc(o.recipientName)}, ` : ""}przypominamy o terminie w projekcie <b>${esc(o.customerName)}</b>.</p>
      <div class="meta">
        <b>Projekt:</b> ${esc(o.projectId)}<br>
        <b>${o.kind === "EXPIRY" ? "Koniec ochrony" : "Termin decyzji"}:</b> ${fmt(o.date)}
        <span class="badge ${o.daysLeft <= 7 ? "badge-danger" : "badge-warn"}">${when}</span>
      </div>
      ${o.kind === "EXPIRY" ? "<p>Jeśli rozmowy trwają, poproś opiekuna ASD o przedłużenie ochrony.</p>" : ""}
      ${o.link ? `<a class="btn" href="${esc(o.link)}">Otwórz projekt</a>` : ""}
    `),
  };
}

export function tplNeedInfo(o: { recipientName?: string | null; projectId: string; customerName: string; link?: string }) {
  return {
    subject: `📝 Przypomnienie: ASD czeka na uzupełnienie — ${o.customerName}`,
    html: base(`
      <h1>Projekt wymaga uzupełnienia</h1>
      <p>${o.recipientName ? `Cześć ${esc(o.recipientName)}, ` : ""}ASD Systems wciąż czeka na uzupełnienie danych w projekcie <b>${esc(o.customerName)}</b> (${esc(o.projectId)}).</p>
      ${o.link ? `<a class="btn" href="${esc(o.link)}">Uzupełnij dane</a>` : ""}
    `),
  };
}

export function tplPendingRequest(o: { count: number; oldestDays: number; link: string }) {
  return {
    subject: `⏳ ${o.count} zgłosze${o.count === 1 ? "nie czeka" : "nia czekają"} na Twoją decyzję`,
    html: base(`
      <h1>Zgłoszenia handlowców czekają</h1>
      <p>Masz <b>${o.count}</b> niezatwierdzon${o.count === 1 ? "e zgłoszenie" : "ych zgłoszeń"} od swoich handlowców
      (najstarsze czeka ${o.oldestDays} dni). Zatwierdź je, aby przekazać projekty do ASD Systems.</p>
      <a class="btn" href="${esc(o.link)}">Przejdź do zgłoszeń</a>
    `),
  };
}
