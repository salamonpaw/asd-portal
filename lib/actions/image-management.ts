"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";

export async function uploadProductImage(
  productId: string,
  formData: FormData
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (!session?.user || !["WAREHOUSE_SPECIALIST", "ADMIN"].includes(role)) {
    return { success: false, error: "Brak dostępu" };
  }

  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "Nie wybrano pliku" };
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: "Obsługiwane formaty: JPEG, PNG, WebP, GIF" };
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "Maksymalny rozmiar pliku: 5MB" };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split(".").pop();
    const fileName = `${timestamp}-${random}.${extension}`;
    const filePath = `/images/${fileName}`;
    const absolutePath = join(process.cwd(), "public", filePath);

    // Save file
    const bytes = await file.arrayBuffer();
    await writeFile(absolutePath, Buffer.from(bytes));

    // Create database record
    const image = await db.productImage.create({
      data: {
        productId,
        filePath,
        fileName,
        mimeType: file.type,
        fileSize: file.size,
        uploadedBy: (session.user as any).email || "unknown",
      },
    });

    return { success: true, data: image };
  } catch (error) {
    console.error("[uploadProductImage] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteProductImage(imageId: string) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (!session?.user || !["WAREHOUSE_SPECIALIST", "ADMIN"].includes(role)) {
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
    return { success: false, error: (error as Error).message };
  }
}

export async function getProductImages(productId: string) {
  try {
    const images = await db.productImage.findMany({
      where: { productId, deletedAt: null },
      orderBy: { uploadedAt: "desc" },
    });
    return { success: true, data: images };
  } catch (error) {
    console.error("[getProductImages] Error:", error);
    return { success: false, error: (error as Error).message, data: null };
  }
}

export async function getAllImages() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (!session?.user || !["WAREHOUSE_SPECIALIST", "ADMIN"].includes(role)) {
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
    return { success: false, error: (error as Error).message, data: null };
  }
}
