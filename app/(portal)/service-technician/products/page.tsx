import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/authz";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { OrderFormClient } from "./OrderFormClient";

export default async function ServiceTechnicianProductsPage() {
  const user = await requirePageRole("SERVICE_TECHNICIAN");

  // Get all products with their images
  const products = await db.product.findMany({
    select: {
      id: true,
      sku: true,
      name: true,
      description: true,
      productImages: {
        where: { deletedAt: null },
        select: { filePath: true },
        take: 1,
        orderBy: { uploadedAt: "asc" }, // pierwsze = główne
      },
    },
    orderBy: { name: "asc" },
  });

  // Szablony firmy + ostatni adres dostawy (podpowiedź)
  const [templates, last] = await Promise.all([
    db.orderTemplate.findMany({ where: { partnerId: user.partnerId ?? "__none__" }, include: { items: { select: { productId: true, quantity: true } } }, orderBy: { name: "asc" } }),
    db.serviceOrder.findFirst({ where: { technicianId: user.id }, orderBy: { createdAt: "desc" }, select: { deliveryAddress: true } }),
  ]);

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
          image: p.productImages[0]?.filePath ?? "",
        }))}
        templates={templates.map((t) => ({ id: t.id, name: t.name, items: t.items }))}
        lastAddress={last?.deliveryAddress ?? ""}
      />
    </div>
  );
}
