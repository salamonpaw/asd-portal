"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { unlink } from "fs/promises";
import path from "path";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session.user;
}

/** Materiał jako link zewnętrzny (np. YouTube). Pliki idą przez /api/upload/marketing. */
export async function createMaterialLink(input: { filename: string; url: string; type: string }) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Brak dostępu" };

  if (!input.filename?.trim() || !input.url?.trim()) {
    return { success: false, error: "Nazwa i link są wymagane" };
  }

  try {
    const material = await db.marketingMaterial.create({
      data: {
        filename: input.filename.trim(),
        url: input.url.trim(),
        type: input.type || "OTHER",
        createdBy: admin.email ?? "admin",
      },
    });
    return { success: true, data: material };
  } catch (error) {
    console.error("[createMaterialLink]", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function toggleMaterialActive(materialId: string, isActive: boolean) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Brak dostępu" };
  try {
    await db.marketingMaterial.update({ where: { id: materialId }, data: { isActive } });
    return { success: true };
  } catch (error) {
    console.error("[toggleMaterialActive]", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteMaterial(materialId: string) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Brak dostępu" };
  try {
    const material = await db.marketingMaterial.findUnique({ where: { id: materialId } });
    // Usuń plik z dysku jeśli to plik lokalny (nie link zewnętrzny)
    if (material?.url && material.url.startsWith("/uploads/")) {
      const abs = path.join(process.cwd(), "public", material.url.replace(/^\//, ""));
      await unlink(abs).catch(() => {});
    }
    await db.marketingMaterial.delete({ where: { id: materialId } });
    return { success: true };
  } catch (error) {
    console.error("[deleteMaterial]", error);
    return { success: false, error: (error as Error).message };
  }
}

/** Nadaje/odbiera dostęp — ustawia pełną listę partnerów mających dostęp. */
export async function setMaterialAccess(materialId: string, partnerIds: string[]) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Brak dostępu" };
  try {
    await db.$transaction([
      db.marketingMaterialAccess.deleteMany({ where: { materialId } }),
      db.marketingMaterialAccess.createMany({
        data: partnerIds.map((partnerId) => ({ materialId, partnerId })),
        skipDuplicates: true,
      }),
    ]);
    return { success: true };
  } catch (error) {
    console.error("[setMaterialAccess]", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getMaterialsAdmin() {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Brak dostępu", data: null };
  try {
    const [materials, partners] = await Promise.all([
      db.marketingMaterial.findMany({
        orderBy: { createdAt: "desc" },
        include: { partnerAccess: { select: { partnerId: true } } },
      }),
      db.partner.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    ]);
    return { success: true, data: { materials, partners } };
  } catch (error) {
    console.error("[getMaterialsAdmin]", error);
    return { success: false, error: (error as Error).message, data: null };
  }
}
