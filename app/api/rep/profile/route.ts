import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { safeHttpUrl } from "@/lib/url";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const repId = session.user.repId;
  if (!repId) return NextResponse.json({ error: "Not a rep account" }, { status: 403 });

  try {
    const { phone, calendarUrl, photoUrl, bio } = await req.json();

    // Link kalendarza tylko http(s); zdjęcie — wyłącznie z naszego uploadu (/uploads/avatars/)
    const cal = calendarUrl?.trim() ? safeHttpUrl(calendarUrl) : null;
    if (calendarUrl?.trim() && !cal) {
      return NextResponse.json({ error: "Link do kalendarza musi zaczynać się od https://" }, { status: 400 });
    }
    const photo = typeof photoUrl === "string" && /^\/uploads\/avatars\/[\w.-]+$/.test(photoUrl.trim()) ? photoUrl.trim() : null;

    const rep = await db.rep.update({
      where: { id: repId },
      data: {
        phone: typeof phone === "string" ? phone.trim().slice(0, 40) || null : null,
        calendarUrl: cal,
        photoUrl: photo,
        bio: typeof bio === "string" ? bio.trim().slice(0, 2000) || null : null,
      },
    });

    return NextResponse.json(rep);
  } catch (err) {
    console.error("[rep/profile]", err);
    return NextResponse.json({ error: "Błąd zapisu – sprawdź logi serwera" }, { status: 500 });
  }
}
