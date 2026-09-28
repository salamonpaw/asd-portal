import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/authz";
import { parseUserInput } from "@/lib/user-input";

export async function POST(req: Request) {
  const admin = await apiUser("ADMIN");
  if (admin instanceof NextResponse) return admin;

  try {
    const parsed = parseUserInput(await req.json(), { requirePassword: true });
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const { password, ...data } = parsed.data;

    const existing = await db.user.findFirst({ where: { email: { equals: data.email, mode: "insensitive" } } });
    if (existing) return NextResponse.json({ error: "Użytkownik z tym e-mailem już istnieje." }, { status: 409 });

    const user = await db.user.create({ data: { ...data, password: await bcrypt.hash(password, 10) } });
    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (err) {
    console.error("[admin/users POST]", err);
    return NextResponse.json({ error: "Błąd serwera." }, { status: 500 });
  }
}
