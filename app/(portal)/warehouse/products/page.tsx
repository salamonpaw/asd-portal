import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { PageHead } from "@/components/ui";
import { ProductsClient } from "./ProductsClient";

export default async function WarehouseProductsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const products = await db.product.findMany({
    select: {
      id: true,
      sku: true,
      name: true,
      costPrice: true,
      sellingPrice: true,
      inStock: true,
      inventory: {
        select: {
          currentStock: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="fadeup" style={{ maxWidth: 1200 }}>
      <PageHead title="Produkty" sub="Zarządzaj cenami i dostępnością produktów." />
      <ProductsClient products={products.map(p => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        costPrice: p.costPrice ? parseFloat(p.costPrice.toString()) : null,
        sellingPrice: p.sellingPrice ? parseFloat(p.sellingPrice.toString()) : null,
        inStock: p.inStock,
        warehouseStock: p.inventory?.currentStock || 0,
      }))} />
    </div>
  );
}
