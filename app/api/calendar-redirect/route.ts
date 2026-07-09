import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * Loguje kliknięcie "Umów spotkanie" partnera i przekierowuje do kalendarza
 * jego handlowca (link MS Bookings/Outlook wklejony w profilu handlowca).
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const origin = new URL(req.url).origin;

  if (!session?.user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const partnerId = session.user.partnerId ?? null;
  if (!partnerId) {
    return NextResponse.redirect(`${origin}/partner/dashboard`);
  }

  const partner = await db.partner.findUnique({
    where: { id: partnerId },
    include: { rep: true },
  });

  const calendarUrl = partner?.rep?.calendarUrl;
  if (!partner?.rep || !calendarUrl) {
    return NextResponse.redirect(`${origin}/partner/dashboard`);
  }

  // Zlicz kliknięcie (nie blokuj przekierowania jeśli zapis padnie)
  try {
    await db.calendarClick.create({
      data: { repId: partner.rep.id, partnerId },
    });
  } catch (err) {
    console.error("[calendar-redirect] click log failed", err);
  }

  return NextResponse.redirect(calendarUrl);
}
