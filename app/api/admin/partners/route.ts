import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { PartnerLevel } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, short, city, country, contact, email, phone, since, level, discount, candidate, repId, markets } = await req.json();

    if (!name?.trim() || !contact?.trim() || !email?.trim() || !repId) {
      return NextResponse.json({ error: "Wymagane: nazwa, kontakt, e-mail, handlowiec." }, { status: 400 });
    }

    const partner = await db.partner.create({
      data: {
        name: name.trim(),
        short: short?.trim() || name.trim().split(" ")[0],
        city: city?.trim() || "",
        country: country || "Polska",
        contact: contact.trim(),
        email: email.trim(),
        phone: phone?.trim() || "",
        since: since?.trim() || new Date().toISOString().slice(0, 7),
        level: level as PartnerLevel,
        discount: parseInt(discount) || 5,
        candidate: !!candidate,
        repId,
        markets: { create: (markets as string[]).map((name) => ({ name })) },
      },
    });

    return NextResponse.json({ id: partner.id }, { status: 201 });
  } catch (err) {
    console.error("[admin/partners POST]", err);
    return NextResponse.json({ error: "Błąd serwera." }, { status: 500 });
  }
}
