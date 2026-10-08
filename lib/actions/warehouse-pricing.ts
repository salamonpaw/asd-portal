"use server";

// Kursy walut (Admin → Kursy walut). Wycena zamówień korzysta z nich przez lib/service-orders/server.ts.
import { db } from "@/lib/db";
import { requireRole, errMsg, UserError } from "@/lib/authz";
import type { Currency } from "@prisma/client";

const CURRENCIES: Currency[] = ["PLN", "EUR", "USD"];

export async function addExchangeRate(fromCurrency: string, toCurrency: string, rate: number, effectiveDate: Date, partnerId?: string) {
  try {
    await requireRole("ADMIN");
    if (!CURRENCIES.includes(fromCurrency as Currency) || !CURRENCIES.includes(toCurrency as Currency)) throw new UserError("Nieprawidłowa waluta.");
    if (fromCurrency === toCurrency) throw new UserError("Waluty muszą się różnić.");
    if (fromCurrency !== "PLN" && toCurrency !== "PLN") throw new UserError("Jedna z walut musi być PLN (wycena przelicza ceny katalogowe z PLN).");
    if (!(rate > 0 && rate < 10000)) throw new UserError("Nieprawidłowy kurs.");
    const date = new Date(effectiveDate);
    if (Number.isNaN(date.getTime())) throw new UserError("Nieprawidłowa data.");
    await db.currencyExchangeRate.create({
      data: { fromCurrency: fromCurrency as Currency, toCurrency: toCurrency as Currency, rate, effectiveDate: date, partnerId: partnerId || null },
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: errMsg(error) };
  }
}
