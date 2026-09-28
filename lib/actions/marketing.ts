"use server";

import { errMsg } from "@/lib/authz";

import { safeHttpUrl } from "@/lib/url";
import { storedName, candidatePaths } from "@/lib/marketing-files";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { unlink } from "fs/promises";

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
  const url = safeHttpUrl(input.url);
  if (!url) return { success: false, error: "Link musi zaczynać się od http:// lub https://" };

  try {
    const material = await db.marketingMaterial.create({
      data: {
        filename: input.filename.trim(),
        url,
        type: input.type || "OTHER",
        createdBy: admin.email ?? "admin",
      },
    });
    return { success: true, data: material };
  } catch (error) {
    console.error("[createMaterialLink]", error);
    return { success: false, error: "Nie udało się zapisać linku." };
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
    return { success: false, error: errMsg(error) };
  }
}

export async function deleteMaterial(materialId: string) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Brak dostępu" };
  try {
    const material = await db.marketingMaterial.findUnique({ where: { id: materialId } });
    // Usuń plik z dysku jeśli to plik lokalny (nie link zewnętrzny)
    const name = material ? storedName(material.url) : null;
    if (name) {
      for (const abs of candidatePaths(name)) await unlink(abs).catch(() => {});
    }
    await db.marketingMaterial.delete({ where: { id: materialId } });
    return { success: true };
  } catch (error) {
    console.error("[deleteMaterial]", error);
    return { success: false, error: errMsg(error) };
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
    return { success: false, error: errMsg(error) };
  }
}

