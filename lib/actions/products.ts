"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface ProductInput {
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
  parentProductId?: string;
}

export async function createProduct(data: ProductInput) {
  try {
    const product = await db.product.create({
      data: {
        ...data,
        basePrice: data.basePrice ? parseFloat(data.basePrice.toString()) : null,
      },
      include: { machineType: true, parentProduct: true },
    });
    revalidatePath("/admin/products");
    return { success: true, data: product };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function updateProduct(id: string, data: ProductInput) {
  try {
    const product = await db.product.update({
      where: { id },
      data: {
        ...data,
        basePrice: data.basePrice ? parseFloat(data.basePrice.toString()) : null,
      },
      include: { machineType: true, parentProduct: true },
    });
    revalidatePath("/admin/products");
    return { success: true, data: product };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteProduct(id: string) {
  try {
    await db.product.delete({
      where: { id },
    });
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getProducts(machineTypeId?: string) {
  try {
    const products = await db.product.findMany({
      where: machineTypeId ? { machineTypeId } : undefined,
      include: { machineType: true, childProducts: true },
      orderBy: { name: "asc" },
    });
    return { success: true, data: products };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getProductById(id: string) {
  try {
    const product = await db.product.findUnique({
      where: { id },
      include: { machineType: true, parentProduct: true, childProducts: true },
    });
    return { success: true, data: product };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
