import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/authz";
import { redirectLocal } from "@/lib/http";
import { safeHttpUrl } from "@/lib/url";

/**
 * Loguje kliknięcie "Umów spotkanie" partnera i przekierowuje do kalendarza
 * jego handlowca (link MS Bookings/Outlook wklejony w profilu handlowca).
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return redirectLocal("/login");
  if (!user.partnerId) return redirectLocal("/partner/dashboard");

  const partner = await db.partner.findUnique({ where: { id: user.partnerId }, include: { rep: true } });
  const calendarUrl = safeHttpUrl(partner?.rep?.calendarUrl);
  if (!partner?.rep || !calendarUrl) return redirectLocal("/partner/dashboard");

  // Zlicz kliknięcie (nie blokuj przekierowania, jeśli zapis padnie)
  try {
    await db.calendarClick.create({ data: { repId: partner.rep.id, partnerId: partner.id } });
  } catch (err) {
    console.error("[calendar-redirect] click log failed", err);
  }

  return NextResponse.redirect(calendarUrl);
}
