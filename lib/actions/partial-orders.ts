"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function createPendingOrderItem(
  serviceOrderItemId: string,
  expectedDate: Date,
  subOrderSuffix: string = "/A"
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "WAREHOUSE_SPECIALIST") {
    return { success: false, error: "Brak dostępu" };
  }

  try {
    const orderItem = await db.serviceOrderItem.findUnique({
      where: { id: serviceOrderItemId },
      select: { serviceOrderId: true }
    });

    if (!orderItem) {
      return { success: false, error: "Item not found" };
    }

    const pending = await db.pendingOrderItem.create({
      data: {
        serviceOrderId: orderItem.serviceOrderId,
        serviceOrderItemId,
        expectedDate,
        subOrderSuffix,
        status: "PENDING",
      },
    });

    return { success: true, data: pending };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getPendingOrderItems(serviceOrderItemId: string) {
  try {
    const items = await db.pendingOrderItem.findMany({
      where: { serviceOrderItemId },
      orderBy: { expectedDate: "asc" },
    });

    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: (error as Error).message, data: [] };
  }
}

export async function updatePendingOrderStatus(
  pendingOrderItemId: string,
  status: "PENDING" | "FULFILLED"
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "WAREHOUSE_SPECIALIST") {
    return { success: false, error: "Brak dostępu" };
  }

  try {
    const updated = await db.pendingOrderItem.update({
      where: { id: pendingOrderItemId },
      data: { status },
    });

    return { success: true, data: updated };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getPendingOrdersNeedingReminder() {
  try {
    const now = new Date();
    const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

    const items = await db.pendingOrderItem.findMany({
      where: {
        status: "PENDING",
        expectedDate: {
          lte: fiveDaysFromNow,
          gte: now,
        },
        reminderSentAt: null,
      },
      include: {
        serviceOrder: { select: { id: true, code: true } },
        serviceOrderItem: { select: { product: { select: { name: true } } } },
      },
    });

    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: (error as Error).message, data: [] };
  }
}

export async function markReminderSent(pendingOrderItemId: string) {
  try {
    const updated = await db.pendingOrderItem.update({
      where: { id: pendingOrderItemId },
      data: { reminderSentAt: new Date() },
    });

    return { success: true, data: updated };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
