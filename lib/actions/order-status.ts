"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ServiceOrderStatus } from "@prisma/client";

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
            product: {
              include: {
                inventory: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return { success: false, error: "Zamówienie nie znalezione" };
    }

    // If changing to ZREALIZOWANE, check inventory and split if needed
    if (newStatus === "ZREALIZOWANE" && order.status !== "ZREALIZOWANE") {
      // Separate items into available and unavailable
      const availableItems = [];
      const unavailableItems = [];

      for (const item of order.items) {
        const currentStock = item.product.inventory?.currentStock || 0;
        if (currentStock >= item.quantity) {
          availableItems.push(item);
        } else {
          unavailableItems.push(item);
        }
      }

      // If some items are unavailable, create split order
      if (unavailableItems.length > 0 && availableItems.length > 0) {
        // Create new order for unavailable items with OCZEKIWANIE_NA_CZĘŚCI status
        const year = new Date().getFullYear();
        const lastOrder = await db.serviceOrder.findFirst({
          where: { code: { startsWith: `SRV-${year}-` } },
          orderBy: { code: "desc" },
          select: { code: true },
        });

        let nextNumber = 1;
        if (lastOrder) {
          const match = lastOrder.code.match(/SRV-\d+-(\d+)/);
          if (match) nextNumber = parseInt(match[1]) + 1;
        }
        const newCode = `SRV-${year}-${String(nextNumber).padStart(4, "0")}`;

        // Create split order for unavailable items
        await db.serviceOrder.create({
          data: {
            code: newCode,
            partnerId: order.partnerId,
            technicianId: order.technicianId,
            status: ServiceOrderStatus.ZAWIESZONE,
            deliveryAddress: order.deliveryAddress,
            neededDate: order.neededDate,
            notes: `Split z zamówienia ${order.code} - czeka na części`,
            items: {
              create: unavailableItems.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                currency: item.currency,
                exchangeRate: item.exchangeRate,
                discountType: item.discountType,
                discountValue: item.discountValue,
              })),
            },
            history: {
              create: [{
                changedBy: (session.user as any).email || "unknown",
                action: "CREATED",
                notes: `Utworzone przez split zamówienia ${order.code}`,
              }],
            },
          },
        });

        // Update original order - remove unavailable items
        for (const item of unavailableItems) {
          await db.serviceOrderItem.delete({
            where: { id: item.id },
          });
        }

        // Mark original order as CZĘŚCIOWO_ZREALIZOWANE since we removed some items
        newStatus = ServiceOrderStatus.CZĘŚCIOWO_ZREALIZOWANE as string;
      }

      // Deduct available items from inventory
      for (const item of availableItems) {
        const inv = item.product.inventory;
        if (inv) {
          const oldStock = inv.currentStock;
          const newStock = Math.max(0, oldStock - item.quantity);

          await db.inventory.update({
            where: { id: inv.id },
            data: { currentStock: newStock },
          });

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
