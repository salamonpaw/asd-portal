import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ServiceOrderClient } from "./ServiceOrderClient";
import { Icon } from "@/components/ui/Icon";

export default async function ServicePage() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;
  const partnerId = (session?.user as any)?.partnerId;

  if (!session || (userRole !== "SERVICE_TECHNICIAN" && userRole !== "PARTNER_ADMIN")) {
    redirect("/login");
  }

  // Get products + machine types for form
  const products = await db.product.findMany({
    select: {
      id: true,
      sku: true,
      name: true,
      machineTypeId: true,
      machineType: true,
      location: true,
      image: true,
      sellingPrice: true,
    },
    orderBy: { name: "asc" },
  });

  const machineTypes = await db.machineType.findMany({
    orderBy: { name: "asc" },
  });

  // Get user's service orders
  const orders = await db.serviceOrder.findMany({
    where: { partnerId },
    include: {
      items: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          discountType: true,
          discountValue: true,
          fulfilledQuantity: true,
          product: true,
        },
      },
      warehouseSpecialist: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate stats
  const totalOrders = orders.length;
  const activeOrders = orders.filter(
    (o) => o.status === "NOWE" || o.status === "ZAAKCEPTOWANE"
  ).length;
  const pricedOrders = orders.filter((o) =>
    o.items?.some((item: any) => item.unitPrice)
  ).length;
  const completedOrders = orders.filter((o) => o.status === "ZREALIZOWANE").length;

  const stats = [
    { label: "Wszystkie zamówienia", value: totalOrders, icon: "clipboard" },
    { label: "Aktywne", value: activeOrders, icon: "play-circle" },
    { label: "Wycenione", value: pricedOrders, icon: "check-circle" },
    { label: "Ukończone", value: completedOrders, icon: "flag" },
  ];

  return (
    <div style={{ padding: "32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 24 }}>
        <div>
          <h1>Serwis — Zamówienia na części</h1>
          <p style={{ color: "var(--ink-3)", marginTop: 8 }}>Twórz i zarządzaj zamówieniami na części zamienne</p>
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

      {/* Quick Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 32 }}>
        {stats.map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "var(--paper)",
              border: "1px solid var(--ink-2)",
              borderRadius: "var(--r-sm)",
              padding: 16,
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                background: "var(--brand-soft)",
                borderRadius: "var(--r-sm)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon name={stat.icon as any} size={20} style={{ color: "var(--brand)" }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 2 }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 20, fontWeight: 600, color: "var(--ink)" }}>
                {stat.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      <ServiceOrderClient
        products={products.map(p => ({
          ...p,
          sellingPrice: p.sellingPrice ? parseFloat(p.sellingPrice.toString()) : null,
        }))}
        machineTypes={machineTypes}
        initialOrders={orders as any}
        userEmail={session.user?.email || ""}
      />
    </div>
  );
}
