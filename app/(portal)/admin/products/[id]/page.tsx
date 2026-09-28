import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { AdminProductForm } from "./AdminProductForm";

export default async function AdminProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role;

  if (!session || userRole !== "ADMIN") {
    redirect("/login");
  }

  const product = await db.product.findUnique({
    where: { id },
    include: {
      machineType: true,
      inventory: { select: { currentStock: true } },
      productImages: { where: { deletedAt: null, filePath: { startsWith: "http" } }, orderBy: { uploadedAt: "asc" }, select: { filePath: true } },
    },
  });

  if (!product) {
    return (
      <div style={{ padding: "32px", textAlign: "center" }}>
        <h1>Produkt nie znaleziony</h1>
        <Link href="/admin/products">← Wróć do listy produktów</Link>
      </div>
    );
  }

  const machineTypes = await db.machineType.findMany({
    orderBy: { name: "asc" },
  });

  const images = product.productImages.map((i) => i.filePath); // zdjęcia-linki; pliki — w Zdjęciach produktów

  return (
    <div style={{ padding: "32px" }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/admin/products" style={{ color: "var(--brand)", textDecoration: "none", fontSize: 14 }}>
          ← Wróć do listy produktów
        </Link>
      </div>

      <h1 style={{ marginBottom: 24 }}>Edycja produktu — {product.name}</h1>

      <AdminProductForm
        product={{
          id: product.id,
          sku: product.sku,
          name: product.name,
          description: product.description || "",
          machineTypeId: product.machineTypeId,
          location: product.location || "",
          serialNumber: product.serialNumber || "",
          supplier: product.supplier || "",
          stock: product.inventory?.currentStock ?? 0,
          costPrice: product.costPrice ? parseFloat(product.costPrice.toString()) : null,
          sellingPrice: product.sellingPrice ? parseFloat(product.sellingPrice.toString()) : null,
        }}
        machineTypes={machineTypes}
        images={images}
      />
    </div>
  );
}
