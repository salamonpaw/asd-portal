"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface CreateDiscountInput {
  partnerId: string;
  percentage: number;
  expirationDate: Date;
  fallbackPercentage: number;
  machineCountRequired?: number;
}

interface UpdateDiscountInput {
  discountId: string;
  percentage: number;
  expirationDate: Date;
  fallbackPercentage: number;
  machineCountRequired?: number;
}

export async function createPartnerDiscount(input: CreateDiscountInput) {
  const session = await getServerSession(authOptions);
  const repId = (session?.user as any)?.repId;

  if (!session?.user || !repId) {
    return { success: false, error: "Brak dostępu" };
  }

  try {
    const discount = await db.partnerDiscount.create({
      data: {
        partnerId: input.partnerId,
        percentage: input.percentage,
        expirationDate: input.expirationDate,
        fallbackPercentage: input.fallbackPercentage,
        machineCountRequired: input.machineCountRequired,
        status: "ACTIVE",
        createdByRepId: repId,
      },
      include: {
        partner: true,
        createdBy: true,
      },
    });

    return {
      success: true,
      data: discount,
    };
  } catch (error) {
    console.error("[createPartnerDiscount]", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

export async function updatePartnerDiscount(input: UpdateDiscountInput) {
  const session = await getServerSession(authOptions);
  const repId = (session?.user as any)?.repId;

  if (!session?.user || !repId) {
    return { success: false, error: "Brak dostępu" };
  }

  try {
    const discount = await db.partnerDiscount.update({
      where: { id: input.discountId },
      data: {
        percentage: input.percentage,
        expirationDate: input.expirationDate,
        fallbackPercentage: input.fallbackPercentage,
        machineCountRequired: input.machineCountRequired,
      },
      include: {
        partner: true,
        createdBy: true,
      },
    });

    return {
      success: true,
      data: discount,
    };
  } catch (error) {
    console.error("[updatePartnerDiscount]", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

export async function deletePartnerDiscount(discountId: string) {
  const session = await getServerSession(authOptions);
  const repId = (session?.user as any)?.repId;

  if (!session?.user || !repId) {
    return { success: false, error: "Brak dostępu" };
  }

  try {
    await db.partnerDiscount.delete({
      where: { id: discountId },
    });

    return { success: true };
  } catch (error) {
    console.error("[deletePartnerDiscount]", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

export async function getRepPartnerDiscounts() {
  const session = await getServerSession(authOptions);
  const repId = (session?.user as any)?.repId;

  if (!session?.user || !repId) {
    return { success: false, error: "Brak dostępu", data: null };
  }

  try {
    const partners = await db.partner.findMany({
      where: {
        repId: repId,
      },
      include: {
        discounts: {
          orderBy: { expirationDate: "asc" },
        },
      },
    });

    return {
      success: true,
      data: partners,
    };
  } catch (error) {
    console.error("[getRepPartnerDiscounts]", error);
    return {
      success: false,
      error: (error as Error).message,
      data: null,
    };
  }
}

export async function getPartnerById(partnerId: string) {
  const session = await getServerSession(authOptions);
  const repId = (session?.user as any)?.repId;

  if (!session?.user || !repId) {
    return { success: false, error: "Brak dostępu", data: null };
  }

  try {
    const partner = await db.partner.findUnique({
      where: { id: partnerId },
      include: {
        discounts: {
          orderBy: { expirationDate: "asc" },
        },
      },
    });

    if (!partner || partner.repId !== repId) {
      return { success: false, error: "Partner nie znaleziony", data: null };
    }

    return {
      success: true,
      data: partner,
    };
  } catch (error) {
    console.error("[getPartnerById]", error);
    return {
      success: false,
      error: (error as Error).message,
      data: null,
    };
  }
}
