"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getInventoryWithOrders() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "WAREHOUSE_SPECIALIST") {
    return { success: false, error: "Brak dostępu", data: null };
  }

  try {
    // Get all products with inventory
    const products = await db.product.findMany({
      include: {
        inventory: true,
      },
    });

    // Get all active orders (not rejected or suspended)
    const activeOrders = await db.serviceOrder.findMany({
      where: {
        status: {
          notIn: ["ODRZUCONE", "ZAWIESZONE", "ZREALIZOWANE"],
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Calculate on-order quantities per product
    const onOrderMap: Record<string, number> = {};
    activeOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!onOrderMap[item.productId]) {
          onOrderMap[item.productId] = 0;
        }
        onOrderMap[item.productId] += item.quantity;
      });
    });

    // Build response with inventory data
    const inventoryData = products.map((product) => {
      const inv = Array.isArray(product.inventory) ? product.inventory[0] : (product.inventory as any);
      const currentStock = inv?.currentStock || 0;
      const onOrder = onOrderMap[product.id] || 0;
      return {
        id: product.id,
        sku: product.sku,
        name: product.name,
        currentStock,
        onOrder,
        isShort: onOrder > currentStock,
      };
    });

    // Sort by shortage (most urgent first)
    inventoryData.sort((a, b) => {
      if (a.isShort && !b.isShort) return -1;
      if (!a.isShort && b.isShort) return 1;
      return (b.onOrder - b.currentStock) - (a.onOrder - a.currentStock);
    });

    return { success: true, data: inventoryData };
  } catch (error) {
    console.error("[getInventoryWithOrders] Error:", error);
    return { success: false, error: (error as Error).message, data: null };
  }
}
