"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function setPartnerProductDiscount(
  partnerId: string,
  productId: string,
  discountPercent: number
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Brak uprawnień" };
  }

  try {
    const discount = await db.partnerProductDiscount.upsert({
      where: {
        partnerId_productId: {
          partnerId,
          productId,
        },
      },
      update: {
        discountPercent,
      },
      create: {
        partnerId,
        productId,
        discountPercent,
      },
    });

    return { success: true, data: discount };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function verifyPartnerDiscount(
  partnerId: string,
  productId: string
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Brak uprawnień" };
  }

  try {
    const discount = await db.partnerProductDiscount.update({
      where: {
        partnerId_productId: {
          partnerId,
          productId,
        },
      },
      data: {
        verifiedAt: new Date(),
      },
    });

    return { success: true, data: discount };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getPartnerProductDiscount(
  partnerId: string,
  productId: string
) {
  try {
    const discount = await db.partnerProductDiscount.findUnique({
      where: {
        partnerId_productId: {
          partnerId,
          productId,
        },
      },
    });

    return discount?.discountPercent || 0;
  } catch {
    return 0;
  }
}

export async function getPartnerDiscounts(partnerId: string) {
  try {
    const discounts = await db.partnerProductDiscount.findMany({
      where: { partnerId },
      include: { product: true },
      orderBy: { product: { name: "asc" } },
    });

    return { success: true, data: discounts };
  } catch (error) {
    return { success: false, error: (error as Error).message, data: [] };
  }
}

export async function checkPartnerOrderStatus(partnerId: string) {
  try {
    const lastOrder = await db.serviceOrder.findFirst({
      where: { partnerId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    if (!lastOrder) {
      return { hasOrder: false, daysAgo: null, needsVerification: true };
    }

    const daysAgo = Math.floor(
      (Date.now() - new Date(lastOrder.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      hasOrder: true,
      daysAgo,
      needsVerification: daysAgo > 365, // Ponad rok bez zamówienia
    };
  } catch (error) {
    return { hasOrder: false, daysAgo: null, needsVerification: false };
  }
}
