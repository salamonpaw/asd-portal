"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function createPartnerUser(
  name: string,
  email: string,
  password: string
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: "Nie zalogowany" };
  }

  const partnerId = (session.user as any).partnerId;
  if (!partnerId) {
    return { success: false, error: "Nie jesteś przypisany do partnera" };
  }

  try {
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
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
    return { success: false, error: (error as Error).message };
  }
}

export async function getPartnerUsers() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: "Nie zalogowany", data: [] };
  }

  const partnerId = (session.user as any).partnerId;
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
    return { success: false, error: (error as Error).message, data: [] };
  }
}
