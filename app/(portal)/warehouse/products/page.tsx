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
      name: true,
      basePrice: true,
      inStock: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="fadeup" style={{ maxWidth: 1200 }}>
      <PageHead title="Produkty" sub="Zarządzaj cenami i dostępnością produktów." />
      <ProductsClient products={products.map(p => ({
        id: p.id,
        name: p.name,
        basePrice: p.basePrice ? parseFloat(p.basePrice.toString()) : null,
        inStock: p.inStock,
      }))} />
    </div>
  );
}
