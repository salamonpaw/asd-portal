import { db } from "@/lib/db";

export type EffectiveDiscount = {
  percentage: number;
  expirationDate: Date | null;
  source: "tier" | "default";
};

/**
 * Zwraca efektywny rabat partnera: aktywny tier (status ACTIVE, niewygasły)
 * nadpisuje domyślny Partner.discount. Gdy brak tieru — domyślny rabat.
 */
export async function getPartnerEffectiveDiscount(
  partnerId: string
): Promise<EffectiveDiscount | null> {
  const partner = await db.partner.findUnique({
    where: { id: partnerId },
    include: {
      discounts: {
        where: { status: "ACTIVE", expirationDate: { gte: new Date() } },
        orderBy: { expirationDate: "asc" },
        take: 1,
      },
    },
  });
  if (!partner) return null;

  const tier = partner.discounts[0];
  if (tier) {
    return {
      percentage: parseFloat(tier.percentage.toString()),
      expirationDate: tier.expirationDate,
      source: "tier",
    };
  }
  return { percentage: partner.discount, expirationDate: null, source: "default" };
}
