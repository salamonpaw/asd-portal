"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole, errMsg, UserError, type SessionUser } from "@/lib/authz";

type DiscountInput = {
  percentage: number;
  expirationDate: Date;
  fallbackPercentage: number;
  machineCountRequired?: number;
};

/** Handlowiec — tylko swoi partnerzy (Partner.repId); admin — wszyscy. */
async function assertPartnerInScope(user: SessionUser, partnerId: string) {
  const partner = await db.partner.findUnique({ where: { id: partnerId }, select: { repId: true } });
  if (!partner) throw new UserError("Nie znaleziono partnera.");
  if (user.role !== "ADMIN" && partner.repId !== user.repId) throw new UserError("To nie jest Twój partner.");
}

function validate(input: DiscountInput) {
  const pct = (n: number) => Number.isFinite(n) && n >= 0 && n <= 100;
  if (!pct(input.percentage)) throw new UserError("Rabat musi być w zakresie 0–100%.");
  if (!pct(input.fallbackPercentage)) throw new UserError("Rabat rezerwowy musi być w zakresie 0–100%.");
  const date = new Date(input.expirationDate);
  if (Number.isNaN(date.getTime())) throw new UserError("Nieprawidłowa data wygaśnięcia.");
  const machines = input.machineCountRequired;
  if (machines !== undefined && machines !== null && !(Number.isInteger(machines) && machines >= 0)) {
    throw new UserError("Liczba maszyn musi być liczbą całkowitą ≥ 0.");
  }
  return {
    percentage: input.percentage,
    expirationDate: date,
    fallbackPercentage: input.fallbackPercentage,
    machineCountRequired: machines ?? null,
  };
}

export async function createPartnerDiscount(input: DiscountInput & { partnerId: string }) {
  try {
    const user = await requireRole("STAFF");
    if (!user.repId) throw new UserError("Konto nie jest przypisane do handlowca.");
    await assertPartnerInScope(user, input.partnerId);
    const data = await db.partnerDiscount.create({
      data: { ...validate(input), partnerId: input.partnerId, status: "ACTIVE", createdByRepId: user.repId },
      include: { partner: true, createdBy: true },
    });
    revalidatePath("/staff/discounts");
    return { success: true as const, data };
  } catch (e) {
    return { success: false as const, error: errMsg(e) };
  }
}

export async function updatePartnerDiscount(input: DiscountInput & { discountId: string }) {
  try {
    const user = await requireRole("STAFF", "ADMIN");
    const existing = await db.partnerDiscount.findUnique({ where: { id: input.discountId }, select: { partnerId: true } });
    if (!existing) throw new UserError("Nie znaleziono rabatu.");
    await assertPartnerInScope(user, existing.partnerId);
    const data = await db.partnerDiscount.update({
      where: { id: input.discountId },
      data: validate(input),
      include: { partner: true, createdBy: true },
    });
    revalidatePath("/staff/discounts");
    return { success: true as const, data };
  } catch (e) {
    return { success: false as const, error: errMsg(e) };
  }
}

export async function deletePartnerDiscount(discountId: string) {
  try {
    const user = await requireRole("STAFF", "ADMIN");
    const existing = await db.partnerDiscount.findUnique({ where: { id: discountId }, select: { partnerId: true } });
    if (!existing) throw new UserError("Nie znaleziono rabatu.");
    await assertPartnerInScope(user, existing.partnerId);
    await db.partnerDiscount.delete({ where: { id: discountId } });
    revalidatePath("/staff/discounts");
    return { success: true as const };
  } catch (e) {
    return { success: false as const, error: errMsg(e) };
  }
}

export async function getRepPartnerDiscounts() {
  try {
    const user = await requireRole("STAFF", "ADMIN");
    const data = await db.partner.findMany({
      where: user.role === "ADMIN" ? {} : { repId: user.repId ?? "__none__" },
      include: { discounts: { orderBy: { expirationDate: "asc" } } },
      orderBy: { name: "asc" },
    });
    return { success: true as const, data };
  } catch (e) {
    return { success: false as const, error: errMsg(e), data: null };
  }
}
