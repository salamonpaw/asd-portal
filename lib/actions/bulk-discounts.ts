"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ActionResult } from "@/lib/types/actions";

interface BulkDiscountInput {
  partnerIds: string[];
  productIds: string[];
  discountPercent: number;
}

export async function applyBulkDiscount(
  input: BulkDiscountInput
): Promise<ActionResult<{ created: number; updated: number }>> {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return { success: false, error: "Brak dostępu" };
  }

  const { partnerIds, productIds, discountPercent } = input;

  if (!partnerIds.length || !productIds.length) {
    return { success: false, error: "Wybierz partnerów i produkty" };
  }

  if (discountPercent < 0 || discountPercent > 100) {
    return { success: false, error: "Rabat musi być między 0 a 100%" };
  }

  try {
    let created = 0;
    let updated = 0;

    for (const partnerId of partnerIds) {
      for (const productId of productIds) {
        const existing = await db.partnerProductDiscount.findUnique({
          where: { partnerId_productId: { partnerId, productId } },
        });

        if (existing) {
          await db.partnerProductDiscount.update({
            where: { partnerId_productId: { partnerId, productId } },
            data: {
              discountPercent,
              verifiedAt: new Date(),
            },
          });
          updated++;
        } else {
          await db.partnerProductDiscount.create({
            data: {
              partnerId,
              productId,
              discountPercent,
              verifiedAt: new Date(),
            },
          });
          created++;
        }
      }
    }

    return { success: true, data: { created, updated } };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getPartnerDiscounts(
  partnerId: string
): Promise<ActionResult<any>> {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return { success: false, error: "Brak dostępu" };
  }

  try {
    const discounts = await db.partnerProductDiscount.findMany({
      where: { partnerId },
      include: {
        product: { select: { id: true, sku: true, name: true } },
      },
    });

    return { success: true, data: discounts };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getAllPartners(): Promise<ActionResult<any>> {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return { success: false, error: "Brak dostępu" };
  }

  try {
    const partners = await db.partner.findMany({
      select: { id: true, name: true, short: true },
      orderBy: { name: "asc" },
    });

    return { success: true, data: partners };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getAllProducts(): Promise<ActionResult<any>> {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return { success: false, error: "Brak dostępu" };
  }

  try {
    const products = await db.product.findMany({
      select: { id: true, sku: true, name: true },
      orderBy: { sku: "asc" },
    });

    return { success: true, data: products };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteDiscount(
  partnerId: string,
  productId: string
): Promise<ActionResult<null>> {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return { success: false, error: "Brak dostępu" };
  }

  try {
    await db.partnerProductDiscount.delete({
      where: { partnerId_productId: { partnerId, productId } },
    });

    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
