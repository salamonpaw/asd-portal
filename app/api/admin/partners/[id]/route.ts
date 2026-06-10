import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { PartnerLevel } from "@prisma/client";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { name, short, city, country, contact, email, phone, since, level, discount, candidate, repId, markets } = await req.json();

    // Replace markets: delete old, create new
    await db.market.deleteMany({ where: { partnerId: id } });

    const partner = await db.partner.update({
      where: { id },
      data: {
        name: name?.trim(),
        short: short?.trim(),
        city: city?.trim(),
        country,
        contact: contact?.trim(),
        email: email?.trim(),
        phone: phone?.trim() || "",
        since: since?.trim(),
        level: level as PartnerLevel,
        discount: parseInt(discount) || 5,
        candidate: !!candidate,
        repId,
        markets: { create: (markets as string[]).map((name) => ({ name })) },
      },
    });

    return NextResponse.json({ id: partner.id });
  } catch (err) {
    console.error("[admin/partners PATCH]", err);
    return NextResponse.json({ error: "Błąd serwera." }, { status: 500 });
  }
}
