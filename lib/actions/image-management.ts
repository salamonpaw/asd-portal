"use server";

import { errMsg } from "@/lib/authz";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, unlink } from "fs/promises";
import { randomBytes } from "crypto";
import { detectImage } from "@/lib/file-type";
import { join } from "path";

export async function uploadProductImage(
  productId: string,
  formData: FormData
) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (!session?.user || !["WAREHOUSE_SPECIALIST", "ADMIN"].includes(role ?? "")) {
    return { success: false, error: "Brak dostępu" };
  }

  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "Nie wybrano pliku" };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "Maksymalny rozmiar pliku: 5MB" };
    }

    // Typ z zawartości pliku, rozszerzenie nadajemy sami (nie z nazwy od użytkownika)
    const buffer = Buffer.from(await file.arrayBuffer());
    const type = detectImage(buffer);
    if (!type) {
      return { success: false, error: "Obsługiwane formaty: JPEG, PNG, WebP, GIF" };
    }

    const fileName = `${Date.now()}-${randomBytes(6).toString("hex")}.${type.ext}`;
    const filePath = `/images/${fileName}`;
    await writeFile(join(process.cwd(), "public", "images", fileName), buffer);

    // Create database record
    const image = await db.productImage.create({
      data: {
        productId,
        filePath,
        fileName,
        mimeType: type.mime,
        fileSize: buffer.length,
        uploadedBy: session.user.email || "unknown",
      },
    });

    return { success: true, data: image };
  } catch (error) {
    console.error("[uploadProductImage] Error:", error);
    return { success: false, error: "Nie udało się zapisać zdjęcia." };
  }
}

export async function deleteProductImage(imageId: string) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (!session?.user || !["WAREHOUSE_SPECIALIST", "ADMIN"].includes(role ?? "")) {
    return { success: false, error: "Brak dostępu" };
  }

  try {
    const image = await db.productImage.findUnique({ where: { id: imageId } });
    if (!image) {
      return { success: false, error: "Obraz nie znaleziony" };
    }

    // Delete file
    const absolutePath = join(process.cwd(), "public", image.filePath);
    try {
      await unlink(absolutePath);
    } catch (e) {
      // File might already be deleted, continue anyway
    }

    // Delete database record
    await db.productImage.delete({ where: { id: imageId } });

    return { success: true };
  } catch (error) {
    console.error("[deleteProductImage] Error:", error);
    return { success: false, error: errMsg(error) };
  }
}

export async function getAllImages() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (!session?.user || !["WAREHOUSE_SPECIALIST", "ADMIN"].includes(role ?? "")) {
    return { success: false, error: "Brak dostępu", data: null };
  }

  try {
    const images = await db.productImage.findMany({
      where: { deletedAt: null },
      include: { product: { select: { id: true, name: true, sku: true } } },
      orderBy: { uploadedAt: "desc" },
    });
    return { success: true, data: images };
  } catch (error) {
    console.error("[getAllImages] Error:", error);
    return { success: false, error: errMsg(error), data: null };
  }
}
