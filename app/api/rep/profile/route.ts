import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const repId = session.user.repId;
  if (!repId) return NextResponse.json({ error: "Not a rep account" }, { status: 403 });

  try {
    const { phone, calendarUrl, photoUrl, bio } = await req.json();

    const rep = await db.rep.update({
      where: { id: repId },
      data: {
        phone: phone?.trim() || null,
        calendarUrl: calendarUrl?.trim() || null,
        photoUrl: photoUrl?.trim() || null,
        bio: bio?.trim() || null,
      },
    });

    return NextResponse.json(rep);
  } catch (err) {
    console.error("[rep/profile]", err);
    return NextResponse.json({ error: "Błąd zapisu – sprawdź logi serwera" }, { status: 500 });
  }
}
