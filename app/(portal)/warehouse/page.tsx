import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { WarehouseOrdersClient } from "./WarehouseOrdersClient";

export default async function WarehousePage() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;

  if (!session || userRole !== "WAREHOUSE_SPECIALIST") {
    redirect("/login");
  }

  // Get all service orders
  const orders = await db.serviceOrder.findMany({
    include: {
      items: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          fulfilledQuantity: true,
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              costPrice: true,
              sellingPrice: true,
            },
          },
        },
      },
      technician: true,
      partner: true,
      warehouseSpecialist: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div style={{ padding: "32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 24 }}>
        <div>
          <h1>Magazyn — Zarządzanie zamówieniami serwisowymi</h1>
          <p style={{ color: "var(--ink-3)", marginTop: 8 }}>Przeglądaj, zatwierdź i realizuj zamówienia na części</p>
        </div>
        <a
          href="/changelog"
          style={{
            fontSize: 12,
            color: "var(--brand)",
            textDecoration: "none",
            padding: "8px 12px",
            background: "var(--brand-soft)",
            borderRadius: "var(--r-sm)",
            cursor: "pointer",
          }}
        >
          📋 Changelog & Wersja
        </a>
      </div>

      <WarehouseOrdersClient initialOrders={orders as any} />
    </div>
  );
}
