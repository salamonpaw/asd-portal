import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Podaj aktualne i nowe hasło." }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Nowe hasło musi mieć minimum 8 znaków." }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "Użytkownik nie znaleziony." }, { status: 404 });

  const ok = await bcrypt.compare(currentPassword, user.password);
  if (!ok) return NextResponse.json({ error: "Aktualne hasło jest nieprawidłowe." }, { status: 400 });

  const hash = await bcrypt.hash(newPassword, 10);
  await db.user.update({ where: { id: userId }, data: { password: hash } });

  return NextResponse.json({ ok: true });
}
