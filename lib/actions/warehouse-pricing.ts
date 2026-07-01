"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function updateOrderItemPricing(
  itemId: string,
  data: {
    currency?: string;
    exchangeRate?: number;
    discountType?: string;
    discountValue?: number;
    notes?: string;
  }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "WAREHOUSE_SPECIALIST") {
    return { success: false, error: "Brak dostępu - nie jesteś magazynierem" };
  }

  try {
    const item = await db.serviceOrderItem.findUnique({
      where: { id: itemId },
      include: {
        serviceOrder: { include: { partner: true } },
        product: true,
      },
    });

    if (!item) {
      return { success: false, error: "Pozycja nie znaleziona" };
    }

    // Calculate final price based on unit price
    let finalPrice = item.unitPrice ? parseFloat(item.unitPrice.toString()) : parseFloat(item.product.sellingPrice?.toString() || "0");

    // Apply discount if provided
    if (data.discountValue && data.discountType) {
      const discountVal = typeof data.discountValue === "string" ? parseFloat(data.discountValue) : data.discountValue;
      if (data.discountType === "PERCENT") {
        finalPrice = finalPrice - (finalPrice * discountVal) / 100;
      } else if (data.discountType === "AMOUNT") {
        finalPrice = finalPrice - discountVal;
      }
    }

    // Ensure finalPrice is not negative
    finalPrice = Math.max(0, finalPrice);

    // Convert discount value to number if it's a string
    const discountValue = data.discountValue === undefined || data.discountValue === null
      ? null
      : typeof data.discountValue === "string" ? parseFloat(data.discountValue) : data.discountValue;

    // Update item
    const updateData: any = {
      discountType: data.discountType as any,
      discountValue: discountValue,
      finalPrice,
    };

    if (data.currency) updateData.currency = data.currency as any;
    if (data.exchangeRate !== undefined) updateData.exchangeRate = data.exchangeRate;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const result = await db.serviceOrderItem.update({
      where: { id: itemId },
      data: updateData,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("[updateOrderItemPricing] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getExchangeRates(
  partnerId: string,
  baseCurrency: string
) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const rates = await db.currencyExchangeRate.findMany({
      where: {
        OR: [{ partnerId }, { partnerId: null }],
        fromCurrency: baseCurrency as any,
        effectiveDate: { lte: today },
      },
      orderBy: { effectiveDate: "desc" },
      take: 100,
    });

    // Group by currency and take latest
    const latestRates: Record<string, number> = {};
    rates.forEach((r) => {
      if (!latestRates[r.toCurrency]) {
        latestRates[r.toCurrency] = parseFloat(r.rate.toString());
      }
    });

    return { success: true, data: latestRates };
  } catch (error) {
    return { success: false, error: (error as Error).message, data: {} };
  }
}

export async function addExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  rate: number,
  effectiveDate: Date,
  partnerId?: string
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Brak dostępu" };
  }

  try {
    await db.currencyExchangeRate.create({
      data: {
        fromCurrency: fromCurrency as any,
        toCurrency: toCurrency as any,
        rate,
        effectiveDate,
        partnerId,
      },
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getSystemConfig() {
  try {
    let config = await db.systemConfig.findFirst();
    if (!config) {
      config = await db.systemConfig.create({
        data: {
          minProfitMargin: 10,
          reminderDaysBefore: 5,
        },
      });
    }
    return {
      success: true,
      data: {
        minProfitMargin: parseFloat(config.minProfitMargin.toString()),
        reminderDaysBefore: config.reminderDaysBefore,
      },
    };
  } catch (error) {
    return { success: false, error: (error as Error).message, data: null };
  }
}

export async function updateSystemConfig(data: {
  minProfitMargin?: number;
  reminderDaysBefore?: number;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Brak dostępu" };
  }

  try {
    let config = await db.systemConfig.findFirst();
    if (!config) {
      config = await db.systemConfig.create({
        data: {
          minProfitMargin: data.minProfitMargin || 10,
          reminderDaysBefore: data.reminderDaysBefore || 5,
        },
      });
    } else {
      config = await db.systemConfig.update({
        where: { id: config.id },
        data,
      });
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function checkPartnerOrderStatus(partnerId: string) {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const lastOrder = await db.serviceOrder.findFirst({
      where: {
        partnerId,
        createdAt: { gte: oneYearAgo },
      },
      orderBy: { createdAt: "desc" },
    });

    const needsVerification = !lastOrder;

    return { success: true, data: { needsVerification, lastOrderDate: lastOrder?.createdAt || null } };
  } catch (error) {
    return { success: false, error: (error as Error).message, data: null };
  }
}
