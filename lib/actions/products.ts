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
  basePrice?: number;
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
        basePrice: input.basePrice ? parseFloat(String(input.basePrice)) : null,
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
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Brak uprawnień" };
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
        ...(input.basePrice !== undefined && { basePrice: input.basePrice ? parseFloat(String(input.basePrice)) : null }),
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

export async function updateProductPrice(
  productId: string,
  price: number
): Promise<ActionResult<{ id: string; name: string; basePrice: number }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Nie zalogowany" };
    }

    // Only WAREHOUSE_SPECIALIST can update prices
    if (session.user.role !== "WAREHOUSE_SPECIALIST") {
      return { success: false, error: "Brak uprawnień" };
    }

    if (price < 0) {
      return { success: false, error: "Cena nie może być ujemna" };
    }

    const product = await db.product.update({
      where: { id: productId },
      data: { basePrice: price },
      select: { id: true, name: true, basePrice: true },
    });

    return {
      success: true,
      data: {
        id: product.id,
        name: product.name,
        basePrice: product.basePrice ? parseFloat(product.basePrice.toString()) : 0,
      }
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
