"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ActionResult } from "@/lib/types/actions";

export async function approveOrder(orderId: string): Promise<ActionResult<null>> {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "WAREHOUSE_SPECIALIST") {
    return { success: false, error: "Brak dostępu" };
  }

  try {
    await db.serviceOrder.update({
      where: { id: orderId },
      data: { status: "PRZYJĘTE" },
    });

    await db.serviceOrderHistory.create({
      data: {
        serviceOrderId: orderId,
        changedBy: (session.user as any).email || "unknown",
        action: "ZATWIERDZONE",
        notes: "Zatwierdzono przez magazyniera",
      },
    });

    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function suspendOrder(orderId: string): Promise<ActionResult<null>> {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "WAREHOUSE_SPECIALIST") {
    return { success: false, error: "Brak dostępu" };
  }

  try {
    await db.serviceOrder.update({
      where: { id: orderId },
      data: { status: "ZAWIESZONE" },
    });

    await db.serviceOrderHistory.create({
      data: {
        serviceOrderId: orderId,
        changedBy: (session.user as any).email || "unknown",
        action: "ZAWIESZONE",
        notes: "Zawieszone przez magazyniera",
      },
    });

    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function rejectOrder(
  orderId: string,
  rejectionReason: string
): Promise<ActionResult<null>> {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "WAREHOUSE_SPECIALIST") {
    return { success: false, error: "Brak dostępu" };
  }

  if (!rejectionReason.trim()) {
    return { success: false, error: "Podaj powód odrzucenia" };
  }

  try {
    await db.serviceOrder.update({
      where: { id: orderId },
      data: {
        status: "ODRZUCONE",
        rejectionReason,
      },
    });

    await db.serviceOrderHistory.create({
      data: {
        serviceOrderId: orderId,
        changedBy: (session.user as any).email || "unknown",
        action: "ODRZUCONE",
        notes: `Powód: ${rejectionReason}`,
      },
    });

    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
