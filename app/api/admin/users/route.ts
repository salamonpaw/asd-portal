import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, email, password, role, partnerId, repId } = await req.json();

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json({ error: "Imię, e-mail i hasło są wymagane." }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email: email.trim() } });
    if (existing) {
      return NextResponse.json({ error: "Użytkownik z tym e-mailem już istnieje." }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        password: hash,
        role: role as Role,
        partnerId: role === "PARTNER" && partnerId ? partnerId : null,
        repId: role === "STAFF" && repId ? repId : null,
      },
    });

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (err) {
    console.error("[admin/users POST]", err);
    return NextResponse.json({ error: "Błąd serwera." }, { status: 500 });
  }
}
