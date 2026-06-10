"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ServiceOrderStatus } from "@prisma/client";

export async function createServiceOrder(
  partnerId: string,
  technicianId: string,
  items: Array<{ productId: string; quantity: number }>,
  deliveryAddress: string,
  neededDate?: string,
  notes?: string
) {
  try {
    if (!items.length) {
      return { success: false, error: "Dodaj co najmniej jedną część" };
    }

    // Generate order code: SRV-2026-XXXX
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
    const code = `SRV-${year}-${String(nextNumber).padStart(4, "0")}`;

    const order = await db.serviceOrder.create({
      data: {
        code,
        partnerId,
        technicianId,
        status: ServiceOrderStatus.NOWE,
        deliveryAddress,
        neededDate: neededDate ? new Date(neededDate) : null,
        notes: notes || null,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
        history: {
          create: [{
            changedBy: "", // TODO: get from session
            action: "CREATED",
            notes: "Zamówienie utworzone przez serwisanta",
          }],
        },
      },
      include: { items: { include: { product: true } } },
    });

    revalidatePath("/partner/service");
    revalidatePath("/warehouse");
    return { success: true, data: order };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function updateServiceOrder(
  orderId: string,
  data: {
    status?: ServiceOrderStatus;
    trackingNumber?: string;
    rejectionReason?: string;
    itemPrices?: Record<string, number>;
  }
) {
  try {
    const updateData: any = {};

    if (data.status) updateData.status = data.status;
    if (data.trackingNumber) updateData.trackingNumber = data.trackingNumber;
    if (data.rejectionReason) updateData.rejectionReason = data.rejectionReason;

    const order = await db.serviceOrder.update({
      where: { id: orderId },
      data: updateData,
      include: { items: { include: { product: true } } },
    });

    // Update item prices if provided
    if (data.itemPrices) {
      for (const [itemId, price] of Object.entries(data.itemPrices)) {
        await db.serviceOrderItem.update({
          where: { id: itemId },
          data: { price },
        });
      }
    }

    // Create history entry
    await db.serviceOrderHistory.create({
      data: {
        serviceOrderId: orderId,
        changedBy: "", // TODO: get from session
        action: data.status ? data.status : "UPDATED",
        notes: `Status: ${data.status}${data.rejectionReason ? `, Powód: ${data.rejectionReason}` : ""}`,
      },
    });

    revalidatePath("/partner/service");
    revalidatePath("/warehouse");
    return { success: true, data: order };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getServiceOrders(filter?: { partnerId?: string; status?: ServiceOrderStatus }) {
  try {
    const orders = await db.serviceOrder.findMany({
      where: filter,
      include: {
        items: { include: { product: true } },
        technician: true,
        partner: true,
        warehouseSpecialist: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: orders };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
