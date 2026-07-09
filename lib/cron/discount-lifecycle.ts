import { db } from "@/lib/db";

/**
 * Cykl życia rabatów tier'owych:
 *  - wygasłe tiery → status EXPIRED + rabat partnera spada do fallbackPercentage
 *  - 60/30 dni przed wygaśnięciem → powiadomienie (raz każde), zapisane w trackerze
 *
 * Status w bazie trzymamy binarnie (ACTIVE/EXPIRED). "Zbliża się wygaśnięcie"
 * jest wyliczane z daty w UI, więc nie zmieniamy tu statusu na EXPIRING_SOON
 * (helper getPartnerEffectiveDiscount filtruje po status=ACTIVE).
 */
export async function processDiscountLifecycle() {
  const now = new Date();

  const active = await db.partnerDiscount.findMany({
    where: { status: "ACTIVE" },
    include: { partner: { select: { id: true, name: true, email: true, discount: true } } },
  });

  let expired = 0;
  let warned60 = 0;
  let warned30 = 0;

  for (const d of active) {
    const days = Math.ceil((d.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // ── Wygasł → fallback + EXPIRED ──────────────────────────────────────────
    if (days < 0) {
      const fallback = Math.round(parseFloat(d.fallbackPercentage.toString()));
      await db.$transaction([
        db.partnerDiscount.update({ where: { id: d.id }, data: { status: "EXPIRED" } }),
        db.partner.update({ where: { id: d.partnerId }, data: { discount: fallback } }),
      ]);
      console.log(
        `[DiscountLifecycle] EXPIRED tier ${d.id} for ${d.partner.name} — rabat partnera → fallback ${fallback}%`
      );
      expired++;
      continue;
    }

    // ── Powiadomienia 60/30 dni ──────────────────────────────────────────────
    if (days > 60) continue;

    // Jeden tracker na rabat
    let tracker = await db.partnerDiscountNotification.findFirst({
      where: { partnerDiscountId: d.id },
    });
    if (!tracker) {
      tracker = await db.partnerDiscountNotification.create({
        data: {
          partnerId: d.partnerId,
          repId: d.createdByRepId,
          partnerDiscountId: d.id,
          daysUntilExpiry: days,
          status: "PENDING",
        },
      });
    }

    if (days <= 30 && !tracker.notificationSent30Days) {
      await db.partnerDiscountNotification.update({
        where: { id: tracker.id },
        data: { notificationSent30Days: true, daysUntilExpiry: days, status: "SENT" },
      });
      console.log(
        `[DiscountLifecycle] 30-day warning: ${d.partner.name} — rabat ${d.percentage}% wygasa za ${days} dni`
      );
      warned30++;
    } else if (days <= 60 && !tracker.notificationSent60Days) {
      await db.partnerDiscountNotification.update({
        where: { id: tracker.id },
        data: { notificationSent60Days: true, daysUntilExpiry: days, status: "SENT" },
      });
      console.log(
        `[DiscountLifecycle] 60-day warning: ${d.partner.name} — rabat ${d.percentage}% wygasa za ${days} dni`
      );
      warned60++;
    }
  }

  return { success: true, expired, warned60, warned30, checked: active.length };
}
