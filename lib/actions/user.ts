"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireRole, errMsg, UserError } from "@/lib/authz";
import { ActionResult } from "@/lib/types/actions";

/** Zmiana imienia i e-maila. Zmiana e-maila (loginu) wymaga podania obecnego hasła. */
export async function updateUserProfile(
  name: string,
  email: string,
  currentPassword?: string
): Promise<ActionResult<{ id: string; name: string; email: string }>> {
  try {
    const me = await requireRole();
    const cleanName = name.trim().slice(0, 120);
    const cleanEmail = email.trim().toLowerCase().slice(0, 200);
    if (!cleanName) throw new UserError("Podaj imię i nazwisko.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) throw new UserError("Nieprawidłowy e-mail.");

    const current = await db.user.findUnique({ where: { id: me.id }, omit: { password: false } });
    if (!current) throw new UserError("Nie znaleziono konta.");

    if (cleanEmail !== current.email.toLowerCase()) {
      if (!currentPassword || !(await bcrypt.compare(currentPassword, current.password))) {
        throw new UserError("Nieprawidłowe hasło — e-mail nie został zmieniony.");
      }
      const taken = await db.user.findFirst({ where: { email: { equals: cleanEmail, mode: "insensitive" }, id: { not: me.id } } });
      if (taken) throw new UserError("Ten e-mail jest już używany.");
    }

    const user = await db.user.update({
      where: { id: me.id },
      data: { name: cleanName, email: cleanEmail },
      select: { id: true, name: true, email: true },
    });
    return { success: true, data: user };
  } catch (e) {
    return { success: false, error: errMsg(e) };
  }
}
