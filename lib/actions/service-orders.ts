"use server";

// Zamówienia części serwisowych — JEDYNE miejsce zmian: tworzenie, wycena, statusy, realizacja.
import { revalidatePath } from "next/cache";
import type { Currency } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole, errMsg, UserError, type SessionUser } from "@/lib/authz";
import { canDo, STATUS_META, type OrderAction } from "@/lib/service-orders/status";
import { finalUnitPrice, marginPct, num, orderView, fmtMoney, type DiscountType } from "@/lib/pricing";
import {
  resolveRate, nextServiceOrderCode, withRetry, planFulfillment, plnToCurrency, itemNumbers, CURRENCIES, type PlanLine,
} from "@/lib/service-orders/server";

type Res<T = undefined> = { success: true; data?: T } | { success: false; error: string };

const ORDERING_ROLES = ["PARTNER", "PARTNER_ADMIN", "SERVICE_TECHNICIAN"] as const;
const WAREHOUSE = ["WAREHOUSE_SPECIALIST", "ADMIN"] as const;

function refresh(orderId?: string) {
  revalidatePath("/warehouse");
  revalidatePath("/partner/service");
  revalidatePath("/service-technician/dashboard");
  if (orderId) {
    revalidatePath(`/warehouse/orders/${orderId}`);
    revalidatePath(`/service-technician/orders/${orderId}`);
  }
}

function parseDay(value: string | undefined | null, field: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new UserError(`Nieprawidłowa data: ${field}.`);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (d < today) throw new UserError(`${field} nie może być w przeszłości.`);
  return d;
}

async function loadForWarehouse(user: SessionUser, orderId: string, action: OrderAction) {
  const order = await db.serviceOrder.findUnique({ where: { id: orderId } });
  if (!order) throw new UserError("Nie znaleziono zamówienia.");
  if (!canDo(order.status, action)) {
    throw new UserError(`Tej operacji nie można wykonać dla zamówienia w statusie „${STATUS_META[order.status].label}”.`);
  }
  return order;
}

// ─── Tworzenie (serwisant / partner) ─────────────────────────────────────────

export async function createServiceOrder(input: {
  items: { productId: string; quantity: number }[];
  deliveryAddress: string;
  neededDate?: string;
  notes?: string;
}): Promise<Res<{ id: string; code: string }>> {
  try {
    const user = await requireRole(...ORDERING_ROLES);
    if (!user.partnerId) throw new UserError("Konto nie jest przypisane do partnera.");

    // scal powtórzone części, sprawdź ilości
    const merged = new Map<string, number>();
    for (const it of input.items ?? []) {
      const q = Number(it.quantity);
      if (!Number.isInteger(q) || q < 1 || q > 999) throw new UserError("Ilość musi być liczbą całkowitą od 1 do 999.");
      merged.set(it.productId, (merged.get(it.productId) ?? 0) + q);
    }
    if (merged.size === 0) throw new UserError("Dodaj co najmniej jedną część.");
    if (merged.size > 100) throw new UserError("Maksymalnie 100 różnych części w zamówieniu.");
    if ([...merged.values()].some((q) => q > 999)) throw new UserError("Łączna ilość jednej części nie może przekroczyć 999.");

    const found = await db.product.count({ where: { id: { in: [...merged.keys()] } } });
    if (found !== merged.size) throw new UserError("Część z koszyka nie istnieje już w katalogu — odśwież stronę.");

    const deliveryAddress = (input.deliveryAddress ?? "").trim();
    if (deliveryAddress.length < 5) throw new UserError("Podaj pełny adres dostawy.");

    const neededDate = parseDay(input.neededDate, "Data potrzeby");
    const notes = (input.notes ?? "").trim().slice(0, 2000) || null;

    const order = await withRetry(async () =>
      db.serviceOrder.create({
        data: {
          code: await nextServiceOrderCode(),
          partnerId: user.partnerId!,
          technicianId: user.id,
          deliveryAddress: deliveryAddress.slice(0, 500),
          neededDate,
          notes,
          items: { create: [...merged].map(([productId, quantity]) => ({ productId, quantity })) },
          history: { create: { changedBy: user.email, action: "UTWORZONE", notes: `Zamówienie utworzone (${merged.size} poz.)` } },
        },
        select: { id: true, code: true },
      })
    );

    refresh(order.id);
    return { success: true, data: order };
  } catch (e) {
    return { success: false, error: errMsg(e) };
  }
}

// ─── Wycena (magazyn) ────────────────────────────────────────────────────────

export async function priceServiceOrder(
  orderId: string,
  input: {
    currency: Currency;
    lines: { itemId: string; discountType: DiscountType | null; discountValue: number | null; manualUnitPrice?: number | null }[];
    // Ręczne ceny i marża poniżej minimum partnera wymagają potwierdzenia „na własną odpowiedzialność”
    // (zapisywane w historii z nazwiskiem). Dotyczy magazynu i admina.
    confirmResponsibility?: boolean;
  }
): Promise<Res<{ total: string }>> {
  try {
    const user = await requireRole(...WAREHOUSE);
    const order = await loadForWarehouse(user, orderId, "price");
    if (!CURRENCIES.includes(input.currency)) throw new UserError("Nieprawidłowa waluta.");

    const rate = await resolveRate(order.partnerId, input.currency);
    if (!rate) throw new UserError(`Brak kursu ${input.currency}↔PLN — dodaj go w Admin → Kursy walut.`);

    const [items, partner] = await Promise.all([
      db.serviceOrderItem.findMany({ where: { serviceOrderId: orderId }, include: { product: true } }),
      db.partner.findUnique({ where: { id: order.partnerId }, select: { minProfitMargin: true } }),
    ]);
    const byId = new Map(input.lines.map((l) => [l.itemId, l]));
    if (items.some((i) => !byId.has(i.id))) throw new UserError("Wycena musi obejmować wszystkie pozycje — odśwież stronę.");

    const manualOf = (id: string) => {
      const v = byId.get(id)?.manualUnitPrice;
      return v === null || v === undefined ? null : Number(v);
    };
    for (const i of items) {
      const m = manualOf(i.id);
      if (m !== null && !(Number.isFinite(m) && m > 0 && m <= 1_000_000)) throw new UserError(`${i.product.sku}: nieprawidłowa cena ręczna.`);
    }
    const noPrice = items.filter((i) => manualOf(i.id) === null && num(i.product.sellingPrice) === null).map((i) => i.product.sku);
    if (noPrice.length) throw new UserError(`Brak ceny dla: ${noPrice.join(", ")} — uzupełnij cennik albo wpisz cenę ręcznie.`);

    const minMargin = num(partner?.minProfitMargin) ?? 0;
    const lowMargin: string[] = [];
    const manual: string[] = [];

    const updates = items.map((i) => {
      const l = byId.get(i.id)!;
      const manualPrice = manualOf(i.id);
      const unitPrice = manualPrice !== null ? Math.round(manualPrice * 100) / 100 : plnToCurrency(num(i.product.sellingPrice)!, rate.rate);
      if (manualPrice !== null) manual.push(`${i.product.sku} ${fmtMoney(unitPrice, input.currency)}`);
      const costPln = num(i.product.costPrice);
      const costPrice = costPln === null ? null : plnToCurrency(costPln, rate.rate);
      const type = l.discountType && (l.discountValue ?? 0) > 0 ? l.discountType : null;
      const value = type ? Number(l.discountValue) : null;
      if (type === "PERCENT" && !(value! >= 0 && value! <= 100)) throw new UserError(`${i.product.sku}: rabat musi być w zakresie 0–100%.`);
      if (type === "AMOUNT" && !(value! >= 0 && value! <= unitPrice)) throw new UserError(`${i.product.sku}: rabat kwotowy nie może przekroczyć ceny.`);
      if (type && !Number.isFinite(value)) throw new UserError(`${i.product.sku}: nieprawidłowy rabat.`);
      const finalPrice = finalUnitPrice(unitPrice, type, value);
      const m = marginPct(finalPrice, costPrice);
      if (m !== null && m < minMargin) lowMargin.push(`${i.product.sku} (${m}%)`);
      return { id: i.id, quantity: i.quantity, unitPrice, costPrice, discountType: type, discountValue: value, finalPrice, manualPrice: manualPrice !== null };
    });

    if ((lowMargin.length || manual.length) && !input.confirmResponsibility) {
      throw new UserError(
        [
          lowMargin.length ? `Marża poniżej minimum partnera (${minMargin}%): ${lowMargin.join(", ")}.` : "",
          manual.length ? `Ceny ręczne: ${manual.join(", ")}.` : "",
          "Zaznacz potwierdzenie „na własną odpowiedzialność”, aby zapisać.",
        ].filter(Boolean).join(" ")
      );
    }

    const total = orderView(updates).total;
    await db.$transaction([
      ...updates.map((u) =>
        db.serviceOrderItem.update({
          where: { id: u.id },
          data: { unitPrice: u.unitPrice, costPrice: u.costPrice, discountType: u.discountType, discountValue: u.discountValue, finalPrice: u.finalPrice, manualPrice: u.manualPrice },
        })
      ),
      db.serviceOrder.update({
        where: { id: orderId },
        data: { currency: input.currency, exchangeRate: rate.rate, pricedAt: new Date(), warehouseSpecialistId: user.id },
      }),
      db.serviceOrderHistory.create({
        data: {
          serviceOrderId: orderId, changedBy: user.email, action: "WYCENA",
          notes: [
            `Wycena: ${fmtMoney(total, input.currency)}${input.currency !== "PLN" ? ` (${rate.label})` : ""}`,
            manual.length ? `ceny ręczne: ${manual.join(", ")}` : "",
            lowMargin.length ? `marża poniżej minimum: ${lowMargin.join(", ")}` : "",
            manual.length || lowMargin.length ? `zatwierdził na własną odpowiedzialność: ${user.name} (${user.email})` : "",
          ].filter(Boolean).join(" · "),
        },
      }),
    ]);

    refresh(orderId);
    return { success: true, data: { total: fmtMoney(total, input.currency) } };
  } catch (e) {
    return { success: false, error: errMsg(e) };
  }
}

// ─── Realizacja (magazyn) ────────────────────────────────────────────────────

async function stockFor(productIds: string[]) {
  const inv = await db.inventory.findMany({ where: { productId: { in: productIds } } });
  return new Map(inv.map((i) => [i.productId, i.currentStock]));
}

/** Podgląd: co wyślemy teraz, co poczeka (bieżące stany). */
export async function previewFulfillment(orderId: string): Promise<Res<{ lines: PlanLine[]; priced: boolean }>> {
  try {
    const user = await requireRole(...WAREHOUSE);
    await loadForWarehouse(user, orderId, "fulfill");
    const items = await db.serviceOrderItem.findMany({ where: { serviceOrderId: orderId }, include: { product: { select: { name: true, sku: true } } }, orderBy: { createdAt: "asc" } });
    const lines = planFulfillment(items, await stockFor(items.map((i) => i.productId)));
    return { success: true, data: { lines, priced: orderView(items.map(itemNumbers)).priced } };
  } catch (e) {
    return { success: false, error: errMsg(e) };
  }
}

/**
 * Realizacja: wydaje z magazynu to, co jest; brakujące ilości przenosi do nowego zamówienia
 * „Oczekuje na części” z przewidywaną datą. Wszystko w jednej transakcji, z blokadą
 * wierszy magazynu — ta sama sztuka nie zejdzie ze stanu dwa razy.
 */
export async function fulfillServiceOrder(orderId: string, input: { expectedDate?: string }): Promise<Res<{ status: string; childCode?: string }>> {
  try {
    const user = await requireRole(...WAREHOUSE);
    await loadForWarehouse(user, orderId, "fulfill");
    const expected = input.expectedDate ? parseDay(input.expectedDate, "Przewidywana dostępność") : null;

    const result = await withRetry(() =>
      db.$transaction(async (tx) => {
        // Blokada zamówienia: równoległe „Zrealizuj” czeka i potem widzi już nowy status
        await tx.$queryRaw`SELECT id FROM "ServiceOrder" WHERE id = ${orderId} FOR UPDATE`;
        const order = await tx.serviceOrder.findUnique({
          where: { id: orderId },
          include: { items: { include: { product: { select: { name: true, sku: true } } }, orderBy: { createdAt: "asc" } } },
        });
        if (!order || !canDo(order.status, "fulfill")) throw new UserError("Zamówienie zmieniło status — odśwież stronę.");

        const productIds = [...new Set(order.items.map((i) => i.productId))];
        // blokada wierszy stanu do końca transakcji
        const locked = await tx.$queryRaw<{ id: string; productId: string; currentStock: number }[]>`
          SELECT id, "productId", "currentStock" FROM "Inventory" WHERE "productId" = ANY(${productIds}) FOR UPDATE`;
        const stock = new Map(locked.map((r) => [r.productId, r.currentStock]));
        const plan = planFulfillment(order.items, stock);
        const shipTotal = plan.reduce((s, l) => s + l.ship, 0);
        const waitTotal = plan.reduce((s, l) => s + l.wait, 0);

        if (waitTotal > 0 && !expected) throw new UserError("Części brakuje na stanie — podaj przewidywaną datę dostępności.");
        if (shipTotal > 0 && !orderView(order.items.map(itemNumbers)).priced) {
          throw new UserError("Najpierw zapisz wycenę wszystkich pozycji — wysyłane części muszą mieć cenę.");
        }

        // wydanie z magazynu + historia stanu
        const shipByProduct = new Map<string, number>();
        plan.forEach((l) => shipByProduct.set(l.productId, (shipByProduct.get(l.productId) ?? 0) + l.ship));
        for (const [productId, qty] of shipByProduct) {
          if (qty === 0) continue;
          const row = locked.find((r) => r.productId === productId)!;
          await tx.inventory.update({ where: { id: row.id }, data: { currentStock: row.currentStock - qty } });
          await tx.inventoryAudit.create({
            data: { inventoryId: row.id, fromStock: row.currentStock, toStock: row.currentStock - qty, changedBy: user.email, notes: `Wydanie do zamówienia ${order.code}` },
          });
        }

        // brak czegokolwiek na stanie — całe zamówienie czeka
        if (shipTotal === 0) {
          await tx.serviceOrder.update({ where: { id: orderId }, data: { status: "OCZEKUJE_NA_CZESCI", expectedDate: expected, warehouseSpecialistId: user.id } });
          await tx.serviceOrderHistory.create({ data: { serviceOrderId: orderId, changedBy: user.email, action: "OCZEKUJE_NA_CZESCI", notes: `Brak części na stanie — przewidywana dostępność ${expected!.toLocaleDateString("pl-PL")}` } });
          return { status: "OCZEKUJE_NA_CZESCI" };
        }

        // wszystko jest — pełna realizacja
        if (waitTotal === 0) {
          await tx.serviceOrder.update({ where: { id: orderId }, data: { status: "ZREALIZOWANE", expectedDate: null, warehouseSpecialistId: user.id } });
          await tx.serviceOrderHistory.create({ data: { serviceOrderId: orderId, changedBy: user.email, action: "ZREALIZOWANE", notes: `Wydano z magazynu ${shipTotal} szt.` } });
          return { status: "ZREALIZOWANE" };
        }

        // częściowo — brakujące ilości do nowego zamówienia
        const code = await nextServiceOrderCode(tx);
        await tx.serviceOrder.create({
          data: {
            code, partnerId: order.partnerId, technicianId: order.technicianId, status: "OCZEKUJE_NA_CZESCI",
            deliveryAddress: order.deliveryAddress, neededDate: order.neededDate, notes: order.notes,
            currency: order.currency, exchangeRate: order.exchangeRate, pricedAt: order.pricedAt,
            expectedDate: expected, parentOrderId: order.id, warehouseSpecialistId: user.id,
            items: {
              create: plan.filter((l) => l.wait > 0).map((l) => {
                const src = order.items.find((i) => i.id === l.itemId)!;
                return {
                  productId: src.productId, quantity: l.wait, unitPrice: src.unitPrice, manualPrice: src.manualPrice, costPrice: src.costPrice,
                  discountType: src.discountType, discountValue: src.discountValue, finalPrice: src.finalPrice, notes: src.notes,
                };
              }),
            },
            history: { create: { changedBy: user.email, action: "OCZEKUJE_NA_CZESCI", notes: `Brakujące części z zamówienia ${order.code} — przewidywana dostępność ${expected!.toLocaleDateString("pl-PL")}` } },
          },
        });
        for (const l of plan) {
          if (l.ship === 0) await tx.serviceOrderItem.delete({ where: { id: l.itemId } });
          else if (l.wait > 0) await tx.serviceOrderItem.update({ where: { id: l.itemId }, data: { quantity: l.ship } });
        }
        await tx.serviceOrder.update({ where: { id: orderId }, data: { status: "CZĘŚCIOWO_ZREALIZOWANE", expectedDate: null, warehouseSpecialistId: user.id } });
        await tx.serviceOrderHistory.create({
          data: { serviceOrderId: orderId, changedBy: user.email, action: "CZĘŚCIOWO_ZREALIZOWANE", notes: `Wydano ${shipTotal} szt., brakujące ${waitTotal} szt. → zamówienie ${code}` },
        });
        return { status: "CZĘŚCIOWO_ZREALIZOWANE", childCode: code };
      })
    );

    refresh(orderId);
    return { success: true, data: result };
  } catch (e) {
    return { success: false, error: errMsg(e) };
  }
}

// ─── Statusy, numer przesyłki, data dostępności (magazyn) ───────────────────

export async function changeServiceOrderStatus(
  orderId: string,
  action: "approve" | "suspend" | "resume" | "reject",
  reason?: string
): Promise<Res> {
  try {
    const user = await requireRole(...WAREHOUSE);
    await loadForWarehouse(user, orderId, action);
    const to = { approve: "PRZYJĘTE", suspend: "ZAWIESZONE", resume: "PRZYJĘTE", reject: "ODRZUCONE" } as const;
    const clean = (reason ?? "").trim().slice(0, 1000);
    if (action === "reject" && !clean) throw new UserError("Podaj powód odrzucenia.");

    await db.$transaction([
      db.serviceOrder.update({
        where: { id: orderId },
        data: { status: to[action], warehouseSpecialistId: user.id, ...(action === "reject" ? { rejectionReason: clean } : {}) },
      }),
      db.serviceOrderHistory.create({
        data: { serviceOrderId: orderId, changedBy: user.email, action: to[action], notes: clean ? `Powód: ${clean}` : STATUS_META[to[action]].hint },
      }),
    ]);
    refresh(orderId);
    return { success: true };
  } catch (e) {
    return { success: false, error: errMsg(e) };
  }
}

export async function setTrackingNumber(orderId: string, trackingNumber: string): Promise<Res> {
  try {
    const user = await requireRole(...WAREHOUSE);
    const clean = trackingNumber.trim().slice(0, 100) || null;
    await db.$transaction([
      db.serviceOrder.update({ where: { id: orderId }, data: { trackingNumber: clean } }),
      db.serviceOrderHistory.create({ data: { serviceOrderId: orderId, changedBy: user.email, action: "PRZESYŁKA", notes: clean ? `Numer przesyłki: ${clean}` : "Usunięto numer przesyłki" } }),
    ]);
    refresh(orderId);
    return { success: true };
  } catch (e) {
    return { success: false, error: errMsg(e) };
  }
}

export async function setExpectedDate(orderId: string, date: string): Promise<Res> {
  try {
    const user = await requireRole(...WAREHOUSE);
    const order = await db.serviceOrder.findUnique({ where: { id: orderId }, select: { status: true } });
    if (order?.status !== "OCZEKUJE_NA_CZESCI") throw new UserError("Datę dostępności ustawia się dla zamówień oczekujących na części.");
    const expected = parseDay(date, "Przewidywana dostępność")!;
    await db.$transaction([
      db.serviceOrder.update({ where: { id: orderId }, data: { expectedDate: expected } }),
      db.serviceOrderHistory.create({ data: { serviceOrderId: orderId, changedBy: user.email, action: "TERMIN", notes: `Nowa przewidywana dostępność: ${expected.toLocaleDateString("pl-PL")}` } }),
    ]);
    refresh(orderId);
    return { success: true };
  } catch (e) {
    return { success: false, error: errMsg(e) };
  }
}
