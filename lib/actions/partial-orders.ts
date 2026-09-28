"use server";

import { errMsg } from "@/lib/authz";

import { getSessionUser, AuthError } from "@/lib/authz";

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
    return { success: false, error: errMsg(error) };
  }
}

export async function getPendingOrderItems(serviceOrderItemId: string) {
  const __u = await getSessionUser();
  if (!__u || !["WAREHOUSE_SPECIALIST", "ADMIN"].includes(__u.role)) throw new AuthError();
  try {
    const items = await db.pendingOrderItem.findMany({
      where: { serviceOrderItemId },
      orderBy: { expectedDate: "asc" },
    });

    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: errMsg(error), data: [] };
  }
}
