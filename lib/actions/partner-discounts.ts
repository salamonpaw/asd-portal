"use server";

import { errMsg } from "@/lib/authz";

import { getSessionUser, AuthError } from "@/lib/authz";

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
    return { success: false, error: errMsg(error) };
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
    return { success: false, error: errMsg(error) };
  }
}

export async function getPartnerDiscounts(partnerId: string) {
  const __u = await getSessionUser();
  if (!__u || !["ADMIN", "WAREHOUSE_SPECIALIST"].includes(__u.role)) throw new AuthError();
  try {
    const discounts = await db.partnerProductDiscount.findMany({
      where: { partnerId },
      include: { product: true },
      orderBy: { product: { name: "asc" } },
    });

    return { success: true, data: discounts };
  } catch (error) {
    return { success: false, error: errMsg(error), data: [] };
  }
}

export async function checkPartnerOrderStatus(partnerId: string) {
  const __u = await getSessionUser();
  if (!__u || !["ADMIN", "WAREHOUSE_SPECIALIST", "STAFF"].includes(__u.role)) throw new AuthError();
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
