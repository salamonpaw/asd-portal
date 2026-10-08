// Logika serwerowa zamówień części (bez "use server" — nie jest wystawiana jako akcje).
import type { Currency } from "@prisma/client";
import { endOfDay } from "date-fns";
import { db } from "@/lib/db";
import { getPartnerEffectiveDiscount } from "@/lib/discount";
import { num, round2 } from "@/lib/pricing";

type Tx = Pick<typeof db, "serviceOrder">; // db albo klient transakcji

export const CURRENCIES: Currency[] = ["PLN", "EUR", "USD"];

/**
 * Kurs z panelu admina: ile PLN kosztuje 1 jednostka waluty w dniu `at`.
 * Obsługuje oba kierunki wpisu (EUR→PLN 4,30 albo PLN→EUR 0,2326). Kurs ustawiony
 * dla partnera ma pierwszeństwo przed ogólnym.
 */
export async function resolveRate(partnerId: string, currency: Currency, at = new Date()) {
  if (currency === "PLN") return { rate: 1, label: "PLN" };
  const rows = await db.currencyExchangeRate.findMany({
    where: {
      effectiveDate: { lte: endOfDay(at) },
      OR: [{ partnerId }, { partnerId: null }],
      AND: [{ OR: [{ fromCurrency: currency, toCurrency: "PLN" }, { fromCurrency: "PLN", toCurrency: currency }] }],
    },
    orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }],
  });
  const pick = rows.find((r) => r.partnerId === partnerId) ?? rows.find((r) => r.partnerId === null);
  if (!pick) return null;
  const r = Number(pick.rate);
  if (!(r > 0)) return null;
  const plnPerUnit = pick.fromCurrency === currency ? r : 1 / r;
  return {
    rate: Math.round(plnPerUnit * 1e6) / 1e6,
    label: `1 ${currency} = ${(Math.round(plnPerUnit * 1e4) / 1e4).toLocaleString("pl-PL")} PLN · kurs z ${pick.effectiveDate.toLocaleDateString("pl-PL")}${pick.partnerId ? " (indywidualny partnera)" : ""}`,
  };
}

/** Kursy dla wszystkich walut — do wyboru waluty przy wycenie. */
export async function ratesFor(partnerId: string) {
  const out: Record<string, { rate: number; label: string } | null> = {};
  for (const c of CURRENCIES) out[c] = await resolveRate(partnerId, c);
  return out;
}

/**
 * Domyślny rabat na część: rabat produktowy partnera (Admin → Rabaty hurtowe),
 * a gdy go brak — ogólny rabat partnera (aktywny tier albo domyślny).
 */
export async function defaultDiscounts(partnerId: string, productIds: string[]) {
  const [productRows, general] = await Promise.all([
    db.partnerProductDiscount.findMany({ where: { partnerId, productId: { in: productIds } } }),
    getPartnerEffectiveDiscount(partnerId),
  ]);
  const byProduct = new Map(productRows.map((r) => [r.productId, num(r.discountPercent) ?? 0]));
  const out: Record<string, { value: number; source: string }> = {};
  for (const id of productIds) {
    if (byProduct.has(id)) out[id] = { value: byProduct.get(id)!, source: "rabat produktowy partnera" };
    else if (general && general.percentage > 0)
      out[id] = { value: general.percentage, source: general.source === "tier" ? "rabat specjalny partnera" : "rabat ogólny partnera" };
    else out[id] = { value: 0, source: "brak rabatu" };
  }
  return out;
}

/** Kolejny numer SRV-RRRR-NNNN. Wywoływać w pętli z withRetry (kolizja = ponów). */
export async function nextServiceOrderCode(tx: Tx = db) {
  const prefix = `SRV-${new Date().getFullYear()}-`;
  const rows = await tx.serviceOrder.findMany({ where: { code: { startsWith: prefix } }, select: { code: true } });
  const max = rows.reduce((m, r) => Math.max(m, parseInt(r.code.slice(prefix.length), 10) || 0), 0);
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

/** Ponawia operację przy kolizji unikalnego numeru (P2002). */
export async function withRetry<T>(fn: () => Promise<T>, attempts = 5): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if ((e as { code?: string }).code !== "P2002" || i >= attempts - 1) throw e;
    }
  }
}

export type PlanLine = { itemId: string; productId: string; name: string; sku: string; ordered: number; ship: number; wait: number; stock: number };

/**
 * Plan realizacji: ile każdej pozycji wysłać teraz, a ile czeka. Stan przydzielany
 * kolejno pozycjom tego samego produktu (nie da się „wydać” tej samej sztuki dwa razy).
 */
export function planFulfillment(
  items: { id: string; productId: string; quantity: number; product: { name: string; sku: string } }[],
  stock: Map<string, number>
): PlanLine[] {
  const left = new Map(stock);
  return items.map((i) => {
    const available = left.get(i.productId) ?? 0;
    const ship = Math.min(available, i.quantity);
    left.set(i.productId, available - ship);
    return { itemId: i.id, productId: i.productId, name: i.product.name, sku: i.product.sku, ordered: i.quantity, ship, wait: i.quantity - ship, stock: available };
  });
}

/** Decimal → number dla pozycji (do przekazania do komponentów i lib/pricing). */
export function itemNumbers<T extends { unitPrice: unknown; costPrice: unknown; discountValue: unknown; finalPrice: unknown }>(i: T) {
  return { ...i, unitPrice: num(i.unitPrice), costPrice: num(i.costPrice), discountValue: num(i.discountValue), finalPrice: num(i.finalPrice) };
}

export const plnToCurrency = (pln: number, rate: number) => round2(pln / rate);
