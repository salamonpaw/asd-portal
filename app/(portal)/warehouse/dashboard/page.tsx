import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Icon, EmptyState } from "@/components/ui";

export default async function WarehouseDashboard() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;

  if (!session || userRole !== "WAREHOUSE_SPECIALIST") {
    redirect("/login");
  }

  // Stats
  const totalOrders = await db.serviceOrder.count();
  const totalProducts = await db.product.count();
  const pricedItems = await db.serviceOrderItem.count({
    where: { unitPrice: { not: null } },
  });
  const productsInStock = await db.product.count({
    where: { inStock: { gt: 0 } },
  });

  // Recent orders
  const recentOrders = await db.serviceOrder.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  // Recent products
  const recentProducts = await db.product.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  const stats = [
    { label: "Zamówienia", value: totalOrders, icon: "clipboard" },
    { label: "Produkty w magazynie", value: productsInStock, icon: "box" },
    { label: "Wycenione pozycje", value: pricedItems, icon: "check-circle" },
    { label: "Wszystkie produkty", value: totalProducts, icon: "grid" },
  ];

  return (
    <div style={{ padding: "32px", maxWidth: "1200px" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ marginBottom: 8 }}>Magazyn — Dashboard</h1>
        <p style={{ color: "var(--ink-3)", fontSize: 14 }}>
          Przegląd statusu zamówień i produktów
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 32 }}>
        {stats.map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--ink-2)",
              borderRadius: "var(--r)",
              padding: 20,
              display: "flex",
              alignItems: "flex-start",
              gap: 16,
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                background: "var(--brand-soft)",
                borderRadius: "var(--r-sm)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name={stat.icon as any} size={24} style={{ color: "var(--brand)" }} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 4 }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 28, fontWeight: 600, color: "var(--ink)" }}>
                {stat.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>Ostatnie zamówienia</h2>
          <Link
            href="/warehouse/orders"
            style={{
              fontSize: 13,
              color: "var(--brand)",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Pokaż wszystkie <Icon name="arrow-right" size={14} />
          </Link>
        </div>

        {recentOrders.length > 0 ? (
          <div
            style={{
              background: "var(--paper)",
              border: "1px solid var(--ink-2)",
              borderRadius: "var(--r)",
              overflow: "hidden",
            }}
          >
            {recentOrders.map((order, idx) => (
              <div
                key={order.id}
                style={{
                  padding: 16,
                  borderBottom: idx < recentOrders.length - 1 ? "1px solid var(--ink-2)" : "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <Link
                    href={`/warehouse/orders`}
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: "var(--brand)",
                      textDecoration: "none",
                    }}
                  >
                    {order.code}
                  </Link>
                  <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>
                    {order.items.length} pozycji
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    padding: "4px 8px",
                    background: "var(--surface-2)",
                    borderRadius: "var(--r-sm)",
                    color: "var(--ink-3)",
                  }}
                >
                  {new Date(order.createdAt).toLocaleDateString("pl")}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Brak zamówień"
            sub="Kiedy pojawią się nowe zamówienia serwisowe, zobaczysz je tutaj"
            icon="inbox"
          />
        )}
      </div>

      {/* Recent Products */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>Ostatnie produkty</h2>
          <Link
            href="/warehouse/products"
            style={{
              fontSize: 13,
              color: "var(--brand)",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Pokaż wszystkie <Icon name="arrow-right" size={14} />
          </Link>
        </div>

        {recentProducts.length > 0 ? (
          <div
            style={{
              background: "var(--paper)",
              border: "1px solid var(--ink-2)",
              borderRadius: "var(--r)",
              overflow: "hidden",
            }}
          >
            {recentProducts.map((product, idx) => (
              <div
                key={product.id}
                style={{
                  padding: 16,
                  borderBottom: idx < recentProducts.length - 1 ? "1px solid var(--ink-2)" : "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <Link
                    href={`/warehouse/products/${product.id}`}
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: "var(--brand)",
                      textDecoration: "none",
                    }}
                  >
                    {product.name}
                  </Link>
                  <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>
                    SKU: {product.sku}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    background: product.inStock ? "var(--success-soft)" : "var(--danger-soft)",
                    color: product.inStock ? "var(--success)" : "var(--danger)",
                    padding: "4px 8px",
                    borderRadius: "var(--r-sm)",
                  }}
                >
                  {product.inStock ? `${product.inStock} szt.` : "Brak"}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Brak produktów w magazynie"
            sub="Nie masz produktów do wyświetlenia. Dodaj je w panelu administratora"
            icon="package"
          />
        )}
      </div>
    </div>
  );
}
