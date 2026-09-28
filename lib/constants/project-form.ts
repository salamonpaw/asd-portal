// Wspólne słowniki formularza zgłoszenia projektu (partner + handlowiec partnera)
export const RANGES = ["1", "2–3", "4–6", "8–10", "10–15", "16+", "Nie wiem / do ustalenia"];
export const STAGES = ["Rozpoznanie potrzeb", "Prezentacja / demo", "Oferta", "Negocjacje", "Decyzja klienta"];
export const COUNTRIES = ["Polska", "Czechy", "Słowacja", "Niemcy", "Austria", "Litwa", "Kanada"];
export const PROCUREMENT = [
  { id: "BIEZACA",   label: "Bieżąca sprzedaż",   desc: "Standardowy proces zakupowy klienta.", icon: "shieldCheck" },
  { id: "ZAPYTANIE", label: "Zapytanie ofertowe",  desc: "Klient zbiera oferty, brak formalnego przetargu.", icon: "fileText" },
  { id: "PRZETARG",  label: "Przetarg",            desc: "Oficjalne postępowanie – bez ochrony partnerskiej.", icon: "shieldOff" },
];
export const SUPPORT = [
  "Przygotowanie oferty", "Udział w spotkaniu z klientem", "Wsparcie techniczne",
  "Wsparcie produktowe", "Dobór automatów", "Analiza opłacalności",
  "Materiały marketingowe", "Prezentacja dla klienta", "Indywidualne warunki handlowe",
];

export function validTaxId(country: string, taxId: string) {
  const clean = taxId.replace(/[\s-]/g, "");
  return country === "Polska" ? /^\d{10}$/.test(clean) : clean.length >= 5;
}
