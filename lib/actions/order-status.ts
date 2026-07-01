"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function changeOrderStatus(orderId: string, newStatus: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "WAREHOUSE_SPECIALIST") {
    return { success: false, error: "Brak dostępu" };
  }

  try {
    const order = await db.serviceOrder.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return { success: false, error: "Zamówienie nie znalezione" };
    }

    // If changing to ZREALIZOWANE, deduct from inventory
    if (newStatus === "ZREALIZOWANE" && order.status !== "ZREALIZOWANE") {
      for (const item of order.items) {
        // Get inventory record
        const inv = await db.inventory.findFirst({
          where: { productId: item.productId },
        });

        if (inv) {
          const oldStock = inv.currentStock;
          const newStock = Math.max(0, oldStock - item.quantity);

          // Deduct from inventory
          await db.inventory.update({
            where: { id: inv.id },
            data: {
              currentStock: newStock,
            },
          });

          // Create audit log
          await db.inventoryAudit.create({
            data: {
              inventoryId: inv.id,
              fromStock: oldStock,
              toStock: newStock,
              notes: `Zamówienie ${order.code} zrealizowane - zwolniono ${item.quantity} szt.`,
              changedBy: (session.user as any).email || "unknown",
            },
          });
        }
      }
    }

    // Update order status
    await db.serviceOrder.update({
      where: { id: orderId },
      data: { status: newStatus as any },
    });

    // Log to history
    await db.serviceOrderHistory.create({
      data: {
        serviceOrderId: orderId,
        changedBy: (session.user as any).email || "unknown",
        action: `STATUS_CHANGED_TO_${newStatus}`,
        notes: `Status zmieniony na ${newStatus}${
          newStatus === "ZREALIZOWANE" ? " - magazyn zaktualizowany" : ""
        }`,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("[changeOrderStatus] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}
