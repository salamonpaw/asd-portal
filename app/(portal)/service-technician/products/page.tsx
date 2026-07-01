import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { OrderFormClient } from "./OrderFormClient";

export default async function ServiceTechnicianProductsPage() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;
  const userId = (session?.user as any)?.id;

  if (!session || userRole !== "SERVICE_TECHNICIAN") {
    redirect("/login");
  }

  // Get all products with their images
  const products = await db.product.findMany({
    select: {
      id: true,
      sku: true,
      name: true,
      description: true,
      image: true,
      productImages: {
        where: { deletedAt: null },
        select: { filePath: true },
        take: 1,
        orderBy: { uploadedAt: "desc" },
      },
      inventory: { select: { currentStock: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div style={{ padding: "32px", maxWidth: "1400px" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <Link
          href="/service-technician/dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: "var(--brand)",
            textDecoration: "none",
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          <Icon name="arrow-left" size={16} />
          Powrót do moich zamówień
        </Link>
        <h1 style={{ marginBottom: 8 }}>Złóż zamówienie</h1>
        <p style={{ color: "var(--ink-3)" }}>
          Dodaj części do koszyka, podaj adres dostawy i wyślij zamówienie. Po potwierdzeniu czeka ono na wycenę.
        </p>
      </div>

      <OrderFormClient
        products={products.map((p) => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          description: p.description || "",
          image: p.productImages.length > 0 ? p.productImages[0].filePath : (p.image || ""),
          warehouseStock: p.inventory?.currentStock || 0,
        }))}
      />
    </div>
  );
}
