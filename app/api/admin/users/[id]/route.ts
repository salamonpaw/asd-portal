import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { name, email, password, role, partnerId, repId } = await req.json();

    const data: Record<string, unknown> = {
      name: name?.trim(),
      email: email?.trim(),
      role: role as Role,
      partnerId: role === "PARTNER" && partnerId ? partnerId : null,
      repId: role === "STAFF" && repId ? repId : null,
    };

    if (password?.trim()) {
      data.password = await bcrypt.hash(password.trim(), 10);
    }

    const user = await db.user.update({ where: { id }, data });
    return NextResponse.json({ id: user.id, email: user.email });
  } catch (err) {
    console.error("[admin/users PATCH]", err);
    return NextResponse.json({ error: "Błąd serwera." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const currentUserId = session.user.id as string;
  if (id === currentUserId) {
    return NextResponse.json({ error: "Nie możesz usunąć własnego konta." }, { status: 400 });
  }

  await db.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
