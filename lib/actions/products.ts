"use server";

import { errMsg } from "@/lib/authz";
import { safeHttpUrl } from "@/lib/url";

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
  image?: string;   // URL zdjęcia — dodawane do ProductImage jako główne
  serialNumber?: string;
  supplier?: string;
  stock?: number;   // stan — zapisywany w Inventory (jedyne źródło stanu)
  costPrice?: number;
  sellingPrice?: number;
};

/** Stan produktu żyje wyłącznie w Inventory; każda zmiana trafia do historii (InventoryAudit). */
async function setStock(productId: string, stock: number, changedBy: string) {
  const qty = Math.max(0, Math.round(stock));
  const inv = await db.inventory.findUnique({ where: { productId } });
  if (!inv) {
    const created = await db.inventory.create({ data: { productId, currentStock: qty } });
    await db.inventoryAudit.create({ data: { inventoryId: created.id, fromStock: 0, toStock: qty, changedBy, notes: "Stan ustawiony w edycji produktu" } });
  } else if (inv.currentStock !== qty) {
    await db.inventory.update({ where: { id: inv.id }, data: { currentStock: qty } });
    await db.inventoryAudit.create({ data: { inventoryId: inv.id, fromStock: inv.currentStock, toStock: qty, changedBy, notes: "Stan zmieniony w edycji produktu" } });
  }
}

/** Ustawia zdjęcie z URL jako główne (pierwsze w kolejności) — w tabeli ProductImage. */
async function setMainImage(productId: string, url: string, uploadedBy: string) {
  const clean = url.trim();
  if (!clean || !(safeHttpUrl(clean) || /^\/(images|uploads)\/[\w./-]+$/.test(clean))) return;
  const first = await db.productImage.findFirst({ where: { productId, deletedAt: null }, orderBy: { uploadedAt: "asc" } });
  if (first?.filePath === clean) return;
  const uploadedAt = first ? new Date(first.uploadedAt.getTime() - 1000) : new Date();
  const existing = await db.productImage.findFirst({ where: { productId, filePath: clean, deletedAt: null } });
  if (existing) {
    await db.productImage.update({ where: { id: existing.id }, data: { uploadedAt } });
  } else {
    await db.productImage.create({
      data: { productId, filePath: clean, fileName: clean.replace(/^.*\//, "").slice(0, 200) || "zdjecie", mimeType: "image/jpeg", fileSize: 0, uploadedBy, uploadedAt },
    });
  }
}

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
        serialNumber: input.serialNumber,
        supplier: input.supplier,
        costPrice: input.costPrice ? parseFloat(String(input.costPrice)) : null,
        sellingPrice: input.sellingPrice ? parseFloat(String(input.sellingPrice)) : null,
      },
    });

    const who = session.user.email;
    if (input.stock !== undefined) await setStock(product.id, input.stock, who);
    if (input.image) await setMainImage(product.id, input.image, who);

    return { success: true, data: product };
  } catch (error) {
    return { success: false, error: errMsg(error) };
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
        ...(input.serialNumber !== undefined && { serialNumber: input.serialNumber }),
        ...(input.supplier !== undefined && { supplier: input.supplier }),
        ...(input.costPrice !== undefined && { costPrice: input.costPrice ? parseFloat(String(input.costPrice)) : null }),
        ...(input.sellingPrice !== undefined && { sellingPrice: input.sellingPrice ? parseFloat(String(input.sellingPrice)) : null }),
      },
    });

    if (input.stock !== undefined) await setStock(productId, input.stock, session.user.email);
    if (input.image) await setMainImage(productId, input.image, session.user.email);

    return { success: true, data: product };
  } catch (error) {
    return { success: false, error: errMsg(error) };
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
    return { success: false, error: errMsg(error) };
  }
}

export async function getProducts(): Promise<{ success: boolean; error: string; data: any[] }> {
  try {
    const session = await getServerSession(authOptions);
    // ceny zakupu (costPrice) — tylko admin i magazyn
    if (!session?.user || !["ADMIN", "WAREHOUSE_SPECIALIST"].includes(session.user.role)) {
      return { success: false, error: "Brak dostępu", data: [] };
    }

    const products = await db.product.findMany({
      include: {
        machineType: true,
        inventory: { select: { currentStock: true } },
        productImages: { where: { deletedAt: null }, orderBy: { uploadedAt: "asc" }, take: 1, select: { filePath: true } },
      },
      orderBy: { name: "asc" },
    });

    // Decimal → number; stan i główne zdjęcie z tabel Inventory / ProductImage
    const convertedProducts = products.map(({ inventory, productImages, ...p }) => ({
      ...p,
      stock: inventory?.currentStock ?? 0,
      image: productImages[0]?.filePath ?? null,
      costPrice: p.costPrice ? parseFloat(p.costPrice.toString()) : null,
      sellingPrice: p.sellingPrice ? parseFloat(p.sellingPrice.toString()) : null,
    }));

    return { success: true, error: "", data: convertedProducts };
  } catch (error) {
    return { success: false, error: errMsg(error), data: [] };
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

    if (!["WAREHOUSE_SPECIALIST", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Brak uprawnień" };
    }

    if (!Number.isFinite(costPrice) || !Number.isFinite(sellingPrice) || costPrice > 1_000_000 || sellingPrice > 1_000_000) {
      return { success: false, error: "Podaj poprawne ceny." };
    }
    if (costPrice < 0 || sellingPrice <= 0) {
      return { success: false, error: "Ceny nie mogą być ujemne" };
    }

    if (sellingPrice < costPrice) {
      return { success: false, error: "Cena sprzedaży musi być wyższa niż cena zakupu" };
    }

    const product = await db.product.update({
      where: { id: productId },
      data: { costPrice: Math.round(costPrice * 100) / 100, sellingPrice: Math.round(sellingPrice * 100) / 100 },
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
    return { success: false, error: errMsg(error) };
  }
}

/**
 * Zapisuje listę zdjęć-linków produktu (URL) w ProductImage.
 * Zdjęcia wgrane jako pliki (/images/…) nie są tu ruszane — zarządza nimi galeria.
 */
export async function updateProductImages(
  productId: string,
  images: string[]
): Promise<ActionResult<{ id: string; images: string[] }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["WAREHOUSE_SPECIALIST", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Brak uprawnień" };
    }

    const urls = [...new Set(images.map((u) => safeHttpUrl(u)).filter((u): u is string => !!u))];
    if (urls.length !== images.filter((u) => u.trim()).length) {
      return { success: false, error: "Każdy link musi zaczynać się od http:// lub https://" };
    }

    await db.$transaction([
      db.productImage.deleteMany({ where: { productId, filePath: { startsWith: "http" } } }),
      ...urls.map((url, i) =>
        db.productImage.create({
          data: {
            productId, filePath: url, fileName: url.replace(/^.*\//, "").slice(0, 200) || "zdjecie",
            mimeType: "image/jpeg", fileSize: 0, uploadedBy: session.user.email,
            uploadedAt: new Date(Date.now() + i), // zachowaj kolejność z formularza
          },
        })
      ),
    ]);

    return { success: true, data: { id: productId, images: urls } };
  } catch (error) {
    return { success: false, error: errMsg(error) };
  }
}

export async function createProductAsWarehouse(input: {
  sku: string;
  name: string;
  description?: string;
  location?: string;
  machineTypeId: string;
}): Promise<ActionResult<any>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Nie zalogowany" };
    }

    const role = session.user.role;
    if (role !== "WAREHOUSE_SPECIALIST" && role !== "ADMIN") {
      return { success: false, error: "Brak uprawnień" };
    }

    // Check if SKU already exists
    const existing = await db.product.findUnique({ where: { sku: input.sku } });
    if (existing) {
      return { success: false, error: `Produkt z SKU "${input.sku}" już istnieje` };
    }

    // Validate required fields
    if (!input.sku.trim() || !input.name.trim()) {
      return { success: false, error: "SKU i nazwa są wymagane" };
    }

    const product = await db.product.create({
      data: {
        sku: input.sku.trim(),
        name: input.name.trim(),
        description: input.description?.trim() || null,
        location: input.location || null,
        machineTypeId: input.machineTypeId,
      },
      include: { machineType: true },
    });

    return { success: true, data: product };
  } catch (error) {
    return { success: false, error: errMsg(error) };
  }
}

