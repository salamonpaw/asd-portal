"use server";

import { db } from "@/lib/db";
import { sendOrderCreated } from "@/lib/email";
import { PORTAL_URL } from "@/lib/config";
import type { Order, WaitingItem } from "@prisma/client";
import { ActionResult } from "@/lib/types/actions";

function generateOrderCode(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `ORD-${year}-${random}`;
}

export async function createOrder(projectId: string): Promise<ActionResult<Order & { project: any; supervisorRep: any; supervisorBok: any; waitingFor: any[] }>> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { partner: true, rep: true },
  });

  if (!project) throw new Error("Project not found");

  const code = generateOrderCode();
  const order = await db.order.create({
    data: {
      code,
      projectId,
      supervisorRepId: project.repId,
    },
    include: {
      project: true,
      supervisorRep: true,
      supervisorBok: true,
      waitingFor: true,
    },
  });

  // Send email to rep (handlowiec)
  try {
    await sendOrderCreated({
      to: project.rep.email,
      repName: project.rep.name,
      partnerName: project.partner.name,
      orderId: order.id,
      orderCode: order.code,
      projectId: project.id,
      customerName: project.customerName,
      portalUrl: PORTAL_URL,
    });
  } catch (err) {
    console.error("Failed to send order created email:", err);
  }

  return { success: true, data: order };
}

export async function getOrdersByProject(projectId: string): Promise<ActionResult<(Order & { supervisorRep: any; supervisorBok: any; waitingFor: any[] })[]>> {
  return { success: true, data: await db.order.findMany({
    where: { projectId },
    include: {
      supervisorRep: true,
      supervisorBok: true,
      waitingFor: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  }) };
}

export async function getOrdersByPartner(partnerId: string): Promise<ActionResult<(Order & { project: any; supervisorRep: any; supervisorBok: any; waitingFor: any[] })[]>> {
  return { success: true, data: await db.order.findMany({
    where: { project: { partnerId } },
    include: {
      project: true,
      supervisorRep: true,
      supervisorBok: true,
      waitingFor: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  }) };
}

export async function getOrder(orderId: string): Promise<ActionResult<Order & { project: any; supervisorRep: any; supervisorBok: any; waitingFor: any[] } | null>> {
  return { success: true, data: await db.order.findUnique({
    where: { id: orderId },
    include: {
      project: { include: { partner: true, rep: true } },
      supervisorRep: true,
      supervisorBok: true,
      waitingFor: { orderBy: { createdAt: "asc" } },
    },
  }) };
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
  deliveryDate?: Date,
  estimatedDays?: number
): Promise<ActionResult<Order & { project: any; supervisorRep: any; supervisorBok: any; waitingFor: any[] }>> {
  return { success: true, data: await db.order.update({
    where: { id: orderId },
    data: {
      status,
      deliveryDate: deliveryDate || undefined,
      estimatedDays: estimatedDays || undefined,
    },
    include: {
      project: true,
      supervisorRep: true,
      supervisorBok: true,
      waitingFor: true,
    },
  }) };
}

export async function addWaitingItem(
  orderId: string,
  type: string,
  note?: string
): Promise<ActionResult<WaitingItem>> {
  return { success: true, data: await db.waitingItem.create({
    data: { orderId, type, note },
  }) };
}

export async function updateWaitingItem(
  itemId: string,
  status: string,
  trackingNumber?: string,
  note?: string
): Promise<ActionResult<WaitingItem>> {
  return { success: true, data: await db.waitingItem.update({
    where: { id: itemId },
    data: {
      status,
      trackingNumber: trackingNumber || undefined,
      note: note || undefined,
    },
  }) };
}

export async function deleteWaitingItem(itemId: string): Promise<ActionResult<void>> {
  await db.waitingItem.delete({ where: { id: itemId } });
  return { success: true };
}
