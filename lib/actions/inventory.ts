"use server";

import { errMsg } from "@/lib/authz";

import { getSessionUser, AuthError, UserError } from "@/lib/authz";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Korekta stanów (inwentaryzacja). `fromStock` z przeglądarki służy jako kontrola:
 * jeśli stan w bazie zmienił się od wczytania strony (np. wydanie do zamówienia),
 * zapis jest odrzucany zamiast nadpisać cudzą zmianę.
 */
export async function updateBulkInventory(
  items: Array<{ productId: string; fromStock: number; toStock: number }>,
  notes: string
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["WAREHOUSE_SPECIALIST", "ADMIN"].includes(session.user.role)) {
    return { success: false, error: "Brak dostępu" };
  }
  if (!items.length) return { success: false, error: "Brak zmian do zapisania." };
  if (items.some((i) => !Number.isInteger(i.toStock) || i.toStock < 0 || i.toStock > 1_000_000)) {
    return { success: false, error: "Stan musi być liczbą całkowitą ≥ 0." };
  }

  try {
    const changedBy = session.user.email;
    const updated = await db.$transaction(async (tx) => {
      const ids = items.map((i) => i.productId);
      const locked = await tx.$queryRaw<{ id: string; productId: string; currentStock: number }[]>`
        SELECT id, "productId", "currentStock" FROM "Inventory" WHERE "productId" = ANY(${ids}) FOR UPDATE`;
      const current = new Map(locked.map((r) => [r.productId, r]));

      const stale = items.filter((i) => (current.get(i.productId)?.currentStock ?? 0) !== i.fromStock);
      if (stale.length) {
        const names = await tx.product.findMany({ where: { id: { in: stale.map((i) => i.productId) } }, select: { sku: true } });
        throw new UserError(`Stan zmienił się w międzyczasie (${names.map((n) => n.sku).join(", ")}) — odśwież stronę i wprowadź korektę ponownie.`);
      }

      for (const item of items) {
        if (item.toStock === item.fromStock) continue;
        const row = current.get(item.productId);
        const inv = row
          ? await tx.inventory.update({ where: { id: row.id }, data: { currentStock: item.toStock } })
          : await tx.inventory.create({ data: { productId: item.productId, currentStock: item.toStock } });
        await tx.inventoryAudit.create({
          data: { inventoryId: inv.id, fromStock: item.fromStock, toStock: item.toStock, changedBy, notes: notes?.trim().slice(0, 500) || "Korekta stanu" },
        });
      }
      return items.filter((i) => i.toStock !== i.fromStock);
    });

    return { success: true, data: { updated: updated.length, items: updated } };
  } catch (error) {
    return { success: false, error: errMsg(error) };
  }
}

export async function getInventoryHistory(productId: string, limit: number = 50) {
  const __u = await getSessionUser();
  if (!__u || !["WAREHOUSE_SPECIALIST", "ADMIN"].includes(__u.role)) throw new AuthError();
  try {
    const inventory = await db.inventory.findUnique({
      where: { productId },
      include: {
        audits: {
          orderBy: { createdAt: "desc" },
          take: limit,
        },
        product: {
          select: { id: true, sku: true, name: true },
        },
      },
    });

    return {
      success: true,
      data: inventory || null,
    };
  } catch (error) {
    return { success: false, error: errMsg(error), data: null };
  }
}

export async function getAllInventory() {
  const __u = await getSessionUser();
  if (!__u || !["WAREHOUSE_SPECIALIST", "ADMIN"].includes(__u.role)) throw new AuthError();
  try {
    const inventory = await db.inventory.findMany({
      include: {
        audits: {
          orderBy: { createdAt: "desc" },
        },
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return {
      success: true,
      data: inventory,
    };
  } catch (error) {
    return { success: false, error: errMsg(error), data: [] };
  }
}
