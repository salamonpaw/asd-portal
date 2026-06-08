"use server";

import { db } from "@/lib/db";

function generateOrderCode(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `ORD-${year}-${random}`;
}

export async function createOrder(projectId: string) {
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

  return order;
}

export async function getOrdersByProject(projectId: string) {
  return db.order.findMany({
    where: { projectId },
    include: {
      supervisorRep: true,
      supervisorBok: true,
      waitingFor: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrdersByPartner(partnerId: string) {
  return db.order.findMany({
    where: { project: { partnerId } },
    include: {
      project: true,
      supervisorRep: true,
      supervisorBok: true,
      waitingFor: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrder(orderId: string) {
  return db.order.findUnique({
    where: { id: orderId },
    include: {
      project: { include: { partner: true, rep: true } },
      supervisorRep: true,
      supervisorBok: true,
      waitingFor: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
  deliveryDate?: Date,
  estimatedDays?: number
) {
  return db.order.update({
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
  });
}

export async function addWaitingItem(
  orderId: string,
  type: string,
  note?: string
) {
  return db.waitingItem.create({
    data: { orderId, type, note },
  });
}

export async function updateWaitingItem(
  itemId: string,
  status: string,
  trackingNumber?: string,
  note?: string
) {
  return db.waitingItem.update({
    where: { id: itemId },
    data: {
      status,
      trackingNumber: trackingNumber || undefined,
      note: note || undefined,
    },
  });
}

export async function deleteWaitingItem(itemId: string) {
  return db.waitingItem.delete({ where: { id: itemId } });
}
