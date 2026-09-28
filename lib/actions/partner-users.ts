"use server";

import { errMsg } from "@/lib/authz";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function createPartnerUser(
  name: string,
  email: string,
  password: string
): Promise<
  | { success: true; data: { id: string; name: string; email: string; role: string } }
  | { success: false; error: string }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["PARTNER", "PARTNER_ADMIN"].includes(session.user.role)) {
    return { success: false, error: "Brak dostępu" };
  }
  if (!name?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email?.trim() ?? "")) {
    return { success: false, error: "Podaj imię i poprawny e-mail." };
  }
  if (!password || password.length < 8) {
    return { success: false, error: "Hasło musi mieć min. 8 znaków." };
  }
  email = email.trim().toLowerCase();

  const partnerId = session.user.partnerId;
  if (!partnerId) {
    return { success: false, error: "Nie jesteś przypisany do partnera" };
  }

  try {
    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });

    if (existingUser) {
      return { success: false, error: "Użytkownik z tym emailem już istnieje" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "SERVICE_TECHNICIAN",
        partnerId,
      },
    });

    return {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  } catch (error) {
    return { success: false, error: errMsg(error) };
  }
}

export async function getPartnerUsers() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["PARTNER", "PARTNER_ADMIN"].includes(session.user.role)) {
    return { success: false, error: "Brak dostępu", data: [] };
  }

  const partnerId = session.user.partnerId;
  if (!partnerId) {
    return { success: false, error: "Nie jesteś przypisany do partnera", data: [] };
  }

  try {
    const users = await db.user.findMany({
      where: {
        partnerId,
        role: "SERVICE_TECHNICIAN",
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: users };
  } catch (error) {
    return { success: false, error: errMsg(error), data: [] };
  }
}
