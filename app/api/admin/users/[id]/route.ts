import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/authz";
import { parseUserInput } from "@/lib/user-input";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await apiUser("ADMIN");
  if (admin instanceof NextResponse) return admin;

  try {
    const { id } = await params;
    const parsed = parseUserInput(await req.json(), { requirePassword: false });
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const { password, ...data } = parsed.data;

    const current = await db.user.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: "Nie znaleziono użytkownika." }, { status: 404 });
    if (id === admin.id && data.role !== "ADMIN") {
      return NextResponse.json({ error: "Nie możesz odebrać sobie roli administratora." }, { status: 400 });
    }
    const dup = await db.user.findFirst({ where: { email: { equals: data.email, mode: "insensitive" }, id: { not: id } } });
    if (dup) return NextResponse.json({ error: "Ten e-mail ma już inne konto." }, { status: 409 });

    // Zmiana hasła / roli / przypisania → wylogowanie wszystkich sesji tego użytkownika
    const revoke = !!password || current.role !== data.role || current.partnerId !== data.partnerId || current.repId !== data.repId;

    const user = await db.user.update({
      where: { id },
      data: {
        ...data,
        ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
        ...(revoke ? { sessionVersion: { increment: 1 } } : {}),
      },
    });
    return NextResponse.json({ id: user.id, email: user.email });
  } catch (err) {
    console.error("[admin/users PATCH]", err);
    return NextResponse.json({ error: "Błąd serwera." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await apiUser("ADMIN");
  if (admin instanceof NextResponse) return admin;

  const { id } = await params;
  if (id === admin.id) return NextResponse.json({ error: "Nie możesz usunąć własnego konta." }, { status: 400 });

  // Usunięcie konta = sesje tracą ważność przy najbliższym żądaniu (callback jwt)
  await db.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
