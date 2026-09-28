// Tylko po stronie serwera (strony + /api/orders) — celowo BEZ "use server",
// żeby funkcje nie były wystawione jako publiczne akcje serwera.
import { randomInt } from "crypto";
import type { Order } from "@prisma/client";
import { db } from "@/lib/db";
import { sendOrderCreated } from "@/lib/email";
import { PORTAL_URL } from "@/lib/config";
import { ActionResult } from "@/lib/types/actions";

const ORDER_INCLUDE = { supervisorRep: true, supervisorBok: true, waitingFor: { orderBy: { createdAt: "asc" as const } } };

/** Wywołujący odpowiada za sprawdzenie, że projekt należy do partnera. */
export async function createOrder(projectId: string): Promise<ActionResult<Order>> {
  const project = await db.project.findUnique({ where: { id: projectId }, include: { partner: true, rep: true } });
  if (!project) throw new Error("Project not found");

  let order: Order | null = null;
  for (let attempt = 0; attempt < 5 && !order; attempt++) {
    const code = `ORD-${new Date().getFullYear()}-${String(randomInt(0, 1_000_000)).padStart(6, "0")}`;
    try {
      order = await db.order.create({ data: { code, projectId, supervisorRepId: project.repId } });
    } catch (e) {
      if ((e as { code?: string }).code !== "P2002") throw e; // kolizja kodu → kolejna próba
    }
  }
  if (!order) throw new Error("Nie udało się nadać numeru zamówienia");

  sendOrderCreated({
    to: project.rep.email, repName: project.rep.name, partnerName: project.partner.name,
    orderId: order.id, orderCode: order.code, projectId: project.id,
    customerName: project.customerName, portalUrl: PORTAL_URL,
  }).catch((err) => console.error("Failed to send order created email:", err));

  return { success: true, data: order };
}

export async function getOrdersByPartner(partnerId: string) {
  return {
    success: true as const,
    data: await db.order.findMany({
      where: { project: { partnerId } },
      include: { project: true, ...ORDER_INCLUDE },
      orderBy: { createdAt: "desc" },
    }),
  };
}

export async function getOrder(orderId: string) {
  return {
    success: true as const,
    data: await db.order.findUnique({
      where: { id: orderId },
      include: { project: { include: { partner: true, rep: true } }, ...ORDER_INCLUDE },
    }),
  };
}
