/**
 * JEDYNE miejsce liczenia cen zamówień części — używane przez serwer i wszystkie ekrany
 * (magazyn, serwisant, partner, pulpity). Nie importuje nic serwerowego.
 *
 * Konwencja (ServiceOrderItem): wszystkie kwoty za 1 szt., w walucie zamówienia,
 * zapamiętane w chwili wyceny. Rabat kwotowy (AMOUNT) = kwota na 1 szt.
 */

export type DiscountType = "PERCENT" | "AMOUNT";
export type Currency = "PLN" | "EUR" | "USD";

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Decimal z Prismy / string / number → number | null */
export const num = (v: unknown): number | null =>
  v === null || v === undefined || v === "" ? null : Number(v);

/** Cena za 1 szt. po rabacie */
export function finalUnitPrice(unitPrice: number, discountType: DiscountType | null, discountValue: number | null): number {
  const d = discountValue ?? 0;
  if (!discountType || d <= 0) return round2(unitPrice);
  if (discountType === "PERCENT") return round2(Math.max(0, unitPrice * (1 - d / 100)));
  return round2(Math.max(0, unitPrice - d));
}

/** Marża w % od ceny sprzedaży (null gdy brak ceny zakupu) */
export function marginPct(finalUnit: number | null, costUnit: number | null): number | null {
  if (finalUnit === null || costUnit === null || finalUnit <= 0) return null;
  return round2(((finalUnit - costUnit) / finalUnit) * 100);
}

export type PricedItemInput = {
  quantity: number;
  unitPrice: number | null;
  costPrice?: number | null;
  discountType: DiscountType | null;
  discountValue: number | null;
  finalPrice: number | null;
};

export type LineView = {
  priced: boolean;
  unitPrice: number | null;
  finalUnit: number | null;
  discountPerUnit: number;
  gross: number;      // cena katalogowa × ilość
  discount: number;   // rabat × ilość
  total: number;      // do zapłaty za pozycję
  margin: number | null;
};

/** Widok pozycji. Wyceniona = ma zapisaną cenę końcową (jedyne kryterium w całej aplikacji). */
export function lineView(i: PricedItemInput): LineView {
  if (i.finalPrice === null || i.unitPrice === null) {
    return { priced: false, unitPrice: i.unitPrice, finalUnit: null, discountPerUnit: 0, gross: 0, discount: 0, total: 0, margin: null };
  }
  const gross = round2(i.unitPrice * i.quantity);
  const total = round2(i.finalPrice * i.quantity);
  return {
    priced: true,
    unitPrice: i.unitPrice,
    finalUnit: i.finalPrice,
    discountPerUnit: round2(i.unitPrice - i.finalPrice),
    gross,
    discount: round2(gross - total),
    total,
    margin: marginPct(i.finalPrice, i.costPrice ?? null),
  };
}

export type OrderView = { priced: boolean; pricedCount: number; gross: number; discount: number; total: number; margin: number | null };

export function orderView(items: PricedItemInput[]): OrderView {
  const lines = items.map(lineView);
  const pricedLines = lines.filter((l) => l.priced);
  const gross = round2(pricedLines.reduce((s, l) => s + l.gross, 0));
  const total = round2(pricedLines.reduce((s, l) => s + l.total, 0));
  const cost = items.reduce((s, i, idx) => s + (lines[idx].priced && i.costPrice != null ? i.costPrice * i.quantity : NaN), 0);
  return {
    priced: items.length > 0 && pricedLines.length === items.length,
    pricedCount: pricedLines.length,
    gross,
    discount: round2(gross - total),
    total,
    margin: Number.isFinite(cost) && total > 0 ? round2(((total - cost) / total) * 100) : null,
  };
}

export function fmtMoney(amount: number | null | undefined, currency: Currency | string = "PLN"): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "—";
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency, minimumFractionDigits: 2 }).format(amount);
}

/** 13.03 → „13,0%” */
export const fmtPct = (n: number | null) => (n === null ? "—" : `${n.toLocaleString("pl-PL", { maximumFractionDigits: 1 })}%`);

/** Kwota w walucie zamówienia → PLN (exchangeRate = ile PLN za 1 jednostkę waluty) */
export const toPln = (amount: number, exchangeRate: number) => round2(amount * exchangeRate);
