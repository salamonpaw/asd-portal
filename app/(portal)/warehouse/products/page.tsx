import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { db } from "@/lib/db";
import { WarehouseProductsClient } from "./WarehouseProductsClient";

export const revalidate = 0;

export default async function WarehouseProductsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (!session || role !== "WAREHOUSE_SPECIALIST") {
    redirect("/login");
  }

  const products = await db.product.findMany({
    select: {
      id: true,
      sku: true,
      name: true,
      description: true,
      productImages: {
        where: { deletedAt: null },
        select: { id: true, filePath: true, fileName: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div style={{ padding: "32px", maxWidth: "1200px" }}>
      <div style={{ marginBottom: 32 }}>
        <Link
          href="/warehouse/dashboard"
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
          Powrót do magazynu
        </Link>

        <h1 style={{ marginBottom: 8 }}>📦 Zarządzanie Produktami</h1>
        <p style={{ color: "var(--ink-3)" }}>
          Dodawaj opisy i zdjęcia do produktów
        </p>
      </div>

      <WarehouseProductsClient initialProducts={products} />
    </div>
  );
}
