import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  NOWE: { label: "Nowe — oczekuje potwierdzenia", color: "#0066ff", bg: "#e6f2ff" },
  PRZYJĘTE: { label: "Przyjęte", color: "#00aa00", bg: "#e6ffe6" },
  CZĘŚCIOWO_ZREALIZOWANE: { label: "Częściowo zrealizowane", color: "#ff9900", bg: "#fff4e6" },
  ZREALIZOWANE: { label: "Zrealizowane", color: "#6633cc", bg: "#f3e6ff" },
  ODRZUCONE: { label: "Odrzucone", color: "#cc0000", bg: "#ffe6e6" },
  ZAWIESZONE: { label: "Zawieszone", color: "#666666", bg: "#f0f0f0" },
};

export default async function ServiceTechnicianDashboard() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;
  const userId = (session?.user as any)?.id;

  if (!session || userRole !== "SERVICE_TECHNICIAN") {
    redirect("/login");
  }

  // Get user's orders (only SERVICE_TECHNICIAN created them)
  const orders = await db.serviceOrder.findMany({
    where: { technicianId: userId },
    include: {
      items: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          product: { select: { name: true, sku: true } },
        },
      },
      partner: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Stats
  const totalOrders = orders.length;
  const newOrders = orders.filter((o) => o.status === "NOWE").length;
  const acceptedOrders = orders.filter((o) => o.status === "PRZYJĘTE").length;
  const completedOrders = orders.filter((o) => o.status === "ZREALIZOWANE").length;

  const stats = [
    { label: "Wszystkie zamówienia", value: totalOrders, icon: "clipboard" },
    { label: "Oczekujące potwierdzenia", value: newOrders, icon: "alert-circle" },
    { label: "Przyjęte", value: acceptedOrders, icon: "check-circle" },
    { label: "Ukończone", value: completedOrders, icon: "flag" },
  ];

  return (
    <div style={{ padding: "32px", maxWidth: "1200px" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ marginBottom: 8 }}>Moje Zamówienia</h1>
        <p style={{ color: "var(--ink-3)" }}>
          Przegląd swoich zamówień na części — status i szczegóły
        </p>
      </div>

      {/* Navigation */}
      <div style={{ marginBottom: 24, display: "flex", gap: 8 }}>
        <Link
          href="/service-technician/products"
          style={{
            padding: "8px 16px",
            background: "var(--brand)",
            color: "white",
            textDecoration: "none",
            borderRadius: "var(--r-sm)",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          + Nowe zamówienie
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 32 }}>
        {stats.map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "var(--paper)",
              border: "1px solid var(--ink-2)",
              borderRadius: "var(--r)",
              padding: 16,
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                background: "var(--brand)",
                borderRadius: "var(--r-sm)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon name={stat.icon as any} size={22} style={{ color: "white" }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 2 }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 20, fontWeight: 600 }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Orders List */}
      <div style={{ background: "var(--paper)", border: "1px solid var(--ink-2)", borderRadius: "var(--r)", overflow: "hidden" }}>
        {orders.length > 0 ? (
          orders.map((order, idx) => {
            const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.NOWE;
            const itemsCount = order.items.length;
            const pricedItems = order.items.filter((i) => i.unitPrice).length;

            return (
              <div
                key={order.id}
                style={{
                  padding: 16,
                  borderBottom: idx < orders.length - 1 ? "1px solid var(--ink-2)" : "none",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{order.code}</h3>
                    <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                      Partner: {order.partner.name} • {itemsCount} pozycji
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "6px 12px",
                      background: statusConfig.bg,
                      color: statusConfig.color,
                      borderRadius: "var(--r-sm)",
                      fontSize: 12,
                      fontWeight: 600,
                      textAlign: "center",
                    }}
                  >
                    {statusConfig.label}
                  </div>
                </div>

                {/* Items Preview */}
                <div style={{ marginBottom: 12, fontSize: 12, color: "var(--ink-2)" }}>
                  {order.items.map((item, i) => (
                    <div key={item.id} style={{ marginBottom: 4 }}>
                      {item.product.sku} — {item.product.name} ({item.quantity} szt.)
                      {item.unitPrice && (
                        <span style={{ color: "var(--brand)", fontWeight: 600, marginLeft: 8 }}>
                          {(item.unitPrice as any).toFixed(2)} zł
                        </span>
                      )}
                      {!item.unitPrice && <span style={{ color: "var(--warn)" }}> — oczekuje wyceny</span>}
                    </div>
                  ))}
                </div>

                {/* Status indicator */}
                <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 11 }}>
                  {order.status === "NOWE" && (
                    <span style={{ color: "#0066ff" }}>⏳ Czeka na potwierdzenie przez magazyniera</span>
                  )}
                  {order.status === "PRZYJĘTE" && pricedItems < itemsCount && (
                    <span style={{ color: "#ff9900" }}>💰 {itemsCount - pricedItems} pozycji czeka na wycenę</span>
                  )}
                  {order.status === "PRZYJĘTE" && pricedItems === itemsCount && (
                    <span style={{ color: "#00aa00" }}>✓ Wszystko wycenione — do pobrania</span>
                  )}
                  {order.status === "ZREALIZOWANE" && (
                    <span style={{ color: "#6633cc" }}>✓ Zamówienie ukończone</span>
                  )}
                  {order.status === "ODRZUCONE" && (
                    <span style={{ color: "#cc0000" }}>✗ Zamówienie odrzucone</span>
                  )}
                </div>

                {/* Link to details */}
                <Link
                  href={`/service-technician/orders/${order.id}`}
                  style={{
                    display: "inline-block",
                    marginTop: 8,
                    fontSize: 12,
                    color: "var(--brand)",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  Szczegóły →
                </Link>
              </div>
            );
          })
        ) : (
          <div style={{ padding: 32, textAlign: "center", color: "var(--ink-3)" }}>
            <p>Brak zamówień</p>
            <Link
              href="/service-technician/products"
              style={{
                display: "inline-block",
                marginTop: 12,
                padding: "8px 16px",
                background: "var(--brand)",
                color: "white",
                textDecoration: "none",
                borderRadius: "var(--r-sm)",
                fontSize: 13,
              }}
            >
              Stwórz pierwsze zamówienie
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
