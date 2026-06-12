"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ActionResult } from "@/lib/types/actions";

export async function updateUserProfile(
  name: string,
  email: string
): Promise<ActionResult<{ id: string; name: string; email: string }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return { success: false, error: "Nie zalogowany" };
    }

    const user = await db.user.update({
      where: { email: session.user.email },
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
      },
      select: { id: true, name: true, email: true },
    });

    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getUserProfile(): Promise<ActionResult<{ id: string; name: string; email: string; role: string }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return { success: false, error: "Nie zalogowany" };
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      return { success: false, error: "Użytkownik nie znaleziony" };
    }

    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
