"use server";

import { errMsg } from "@/lib/authz";

import { getSessionUser, AuthError } from "@/lib/authz";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function updateBulkInventory(
  items: Array<{ productId: string; fromStock: number; toStock: number }>,
  notes: string
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "WAREHOUSE_SPECIALIST") {
    return { success: false, error: "Brak dostępu" };
  }

  try {
    const changedBy = session.user.email || "unknown";
    const updates = [];

    for (const item of items) {
      let inventory = await db.inventory.findUnique({
        where: { productId: item.productId },
      });

      if (!inventory) {
        inventory = await db.inventory.create({
          data: {
            productId: item.productId,
            currentStock: item.fromStock,
          },
        });
      }

      await db.inventoryAudit.create({
        data: {
          inventoryId: inventory.id,
          fromStock: item.fromStock,
          toStock: item.toStock,
          changedBy,
          notes,
        },
      });

      await db.inventory.update({
        where: { id: inventory.id },
        data: { currentStock: item.toStock },
      });

      updates.push({ productId: item.productId, fromStock: item.fromStock, toStock: item.toStock });
    }

    return { success: true, data: { updated: updates.length, items: updates } };
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
