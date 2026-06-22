"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ActionResult } from "@/lib/types/actions";

export type ProductInput = {
  sku: string;
  name: string;
  description?: string;
  machineTypeId: string;
  location?: string;
  image?: string;
  serialNumber?: string;
  supplier?: string;
  inStock?: number;
  costPrice?: number;
  sellingPrice?: number;
};

export async function createProduct(input: ProductInput) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Brak uprawnień" };
    }

    const product = await db.product.create({
      data: {
        sku: input.sku,
        name: input.name,
        description: input.description,
        machineTypeId: input.machineTypeId,
        location: input.location,
        image: input.image,
        serialNumber: input.serialNumber,
        supplier: input.supplier,
        inStock: input.inStock,
        costPrice: input.costPrice ? parseFloat(String(input.costPrice)) : null,
        sellingPrice: input.sellingPrice ? parseFloat(String(input.sellingPrice)) : null,
      },
    });

    return { success: true, data: product };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function updateProduct(productId: string, input: Partial<ProductInput>) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Nie zalogowany" };
    }

    const role = session.user.role;
    // Both ADMIN and WAREHOUSE_SPECIALIST can edit product details
    if (role !== "ADMIN" && role !== "WAREHOUSE_SPECIALIST") {
      return { success: false, error: "Brak uprawnień" };
    }

    // Validate pricing if provided
    if (input.costPrice !== undefined && input.sellingPrice !== undefined) {
      const costPrice = input.costPrice ? parseFloat(String(input.costPrice)) : 0;
      const sellingPrice = input.sellingPrice ? parseFloat(String(input.sellingPrice)) : 0;

      if (costPrice < 0 || sellingPrice < 0) {
        return { success: false, error: "Ceny nie mogą być ujemne" };
      }
      if (costPrice > 0 && sellingPrice > 0 && sellingPrice < costPrice) {
        return { success: false, error: "Cena sprzedaży musi być wyższa niż cena zakupu" };
      }
    }

    const product = await db.product.update({
      where: { id: productId },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.machineTypeId && { machineTypeId: input.machineTypeId }),
        ...(input.location !== undefined && { location: input.location }),
        ...(input.image !== undefined && { image: input.image }),
        ...(input.serialNumber !== undefined && { serialNumber: input.serialNumber }),
        ...(input.supplier !== undefined && { supplier: input.supplier }),
        ...(input.inStock !== undefined && { inStock: input.inStock }),
        ...(input.costPrice !== undefined && { costPrice: input.costPrice ? parseFloat(String(input.costPrice)) : null }),
        ...(input.sellingPrice !== undefined && { sellingPrice: input.sellingPrice ? parseFloat(String(input.sellingPrice)) : null }),
      },
    });

    return { success: true, data: product };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteProduct(productId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Brak uprawnień" };
    }

    await db.product.delete({ where: { id: productId } });

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getProducts(): Promise<{ success: boolean; error: string; data: any[] }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Nie zalogowany", data: [] };
    }

    const products = await db.product.findMany({
      include: { machineType: true },
      orderBy: { name: "asc" },
    });

    return { success: true, error: "", data: products };
  } catch (error) {
    return { success: false, error: (error as Error).message, data: [] };
  }
}

export async function updateProductPricing(
  productId: string,
  costPrice: number,
  sellingPrice: number
): Promise<ActionResult<{ id: string; name: string; costPrice: number; sellingPrice: number }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Nie zalogowany" };
    }

    if (session.user.role !== "WAREHOUSE_SPECIALIST") {
      return { success: false, error: "Brak uprawnień" };
    }

    if (costPrice < 0 || sellingPrice < 0) {
      return { success: false, error: "Ceny nie mogą być ujemne" };
    }

    if (sellingPrice < costPrice) {
      return { success: false, error: "Cena sprzedaży musi być wyższa niż cena zakupu" };
    }

    const product = await db.product.update({
      where: { id: productId },
      data: { costPrice, sellingPrice },
      select: { id: true, name: true, costPrice: true, sellingPrice: true },
    });

    return {
      success: true,
      data: {
        id: product.id,
        name: product.name,
        costPrice: parseFloat(product.costPrice?.toString() || "0"),
        sellingPrice: parseFloat(product.sellingPrice?.toString() || "0"),
      }
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function updateProductImages(
  productId: string,
  images: string[]
): Promise<ActionResult<{ id: string; images: string[] }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Nie zalogowany" };
    }

    const role = session.user.role;
    if (role !== "WAREHOUSE_SPECIALIST" && role !== "ADMIN") {
      return { success: false, error: "Brak uprawnień" };
    }

    if (!images || images.length === 0) {
      return { success: false, error: "Dodaj co najmniej jedno zdjęcie" };
    }

    const product = await db.product.update({
      where: { id: productId },
      data: { images: JSON.stringify(images) },
      select: { id: true, images: true },
    });

    return {
      success: true,
      data: {
        id: product.id,
        images: product.images ? JSON.parse(product.images) : [],
      }
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

