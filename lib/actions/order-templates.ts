"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ActionResult } from "@/lib/types/actions";

interface OrderTemplateInput {
  name: string;
  items: Array<{ productId: string; quantity: number }>;
}

export async function createOrderTemplate(
  partnerId: string,
  input: OrderTemplateInput
): Promise<ActionResult<any>> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: "Nie zalogowany" };
  }

  const userRole = (session.user as any).role;
  const userPartnerId = (session.user as any).partnerId;

  // Only partner admins or service technicians of that partner can create
  if (userRole !== "PARTNER_ADMIN" && userRole !== "SERVICE_TECHNICIAN") {
    return { success: false, error: "Brak uprawnień" };
  }

  // Verify user belongs to the partner
  if (userPartnerId !== partnerId) {
    return { success: false, error: "Brak uprawnień do tego partnera" };
  }

  try {
    const template = await db.orderTemplate.create({
      data: {
        partnerId,
        name: input.name,
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: { include: { product: { select: { name: true, sku: true } } } } },
    });

    return { success: true, data: template };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getPartnerTemplates(partnerId: string): Promise<ActionResult<any>> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: "Nie zalogowany" };
  }

  const userRole = (session.user as any).role;
  const userPartnerId = (session.user as any).partnerId;

  if (userPartnerId !== partnerId) {
    return { success: false, error: "Brak uprawnień" };
  }

  try {
    const templates = await db.orderTemplate.findMany({
      where: { partnerId },
      include: {
        items: {
          include: { product: { select: { id: true, name: true, sku: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: templates };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getOrderTemplate(templateId: string): Promise<ActionResult<any>> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: "Nie zalogowany" };
  }

  try {
    const template = await db.orderTemplate.findUnique({
      where: { id: templateId },
      include: {
        items: {
          include: { product: { select: { id: true, name: true, sku: true } } },
        },
      },
    });

    if (!template) {
      return { success: false, error: "Template nie znaleziony" };
    }

    // Verify user belongs to this partner
    const userPartnerId = (session.user as any).partnerId;
    if (userPartnerId !== template.partnerId) {
      return { success: false, error: "Brak uprawnień" };
    }

    return { success: true, data: template };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function updateOrderTemplate(
  templateId: string,
  input: OrderTemplateInput
): Promise<ActionResult<any>> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: "Nie zalogowany" };
  }

  try {
    const template = await db.orderTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return { success: false, error: "Template nie znaleziony" };
    }

    const userPartnerId = (session.user as any).partnerId;
    if (userPartnerId !== template.partnerId) {
      return { success: false, error: "Brak uprawnień" };
    }

    // Delete old items and create new ones
    await db.orderTemplateItem.deleteMany({
      where: { templateId },
    });

    const updated = await db.orderTemplate.update({
      where: { id: templateId },
      data: {
        name: input.name,
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: { include: { product: { select: { name: true, sku: true } } } } },
    });

    return { success: true, data: updated };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteOrderTemplate(templateId: string): Promise<ActionResult<null>> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: "Nie zalogowany" };
  }

  try {
    const template = await db.orderTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return { success: false, error: "Template nie znaleziony" };
    }

    const userPartnerId = (session.user as any).partnerId;
    if (userPartnerId !== template.partnerId) {
      return { success: false, error: "Brak uprawnień" };
    }

    await db.orderTemplate.delete({
      where: { id: templateId },
    });

    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function createOrderFromTemplate(
  templateId: string,
  deliveryAddress: string
): Promise<ActionResult<any>> {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;

  if (!session?.user || userRole !== "SERVICE_TECHNICIAN") {
    return { success: false, error: "Brak dostępu" };
  }

  try {
    const template = await db.orderTemplate.findUnique({
      where: { id: templateId },
      include: { items: true },
    });

    if (!template) {
      return { success: false, error: "Template nie znaleziony" };
    }

    const userId = (session.user as any).id;
    const partnerId = template.partnerId;

    // Generate order code
    const orderCode = `SRV-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`;

    // Create service order with items from template
    const order = await db.serviceOrder.create({
      data: {
        code: orderCode,
        partnerId,
        technicianId: userId,
        deliveryAddress: deliveryAddress || "",
        items: {
          create: template.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: { include: { product: true } } },
    });

    return { success: true, data: order };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
