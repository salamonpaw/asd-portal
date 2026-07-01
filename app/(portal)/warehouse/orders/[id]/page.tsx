import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { OrderPricingClient } from "./OrderPricingClient";

// Wyłącz caching dla dynamic order pages - zawsze swieże dane
export const revalidate = 0;

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;

  if (!session || userRole !== "WAREHOUSE_SPECIALIST") {
    redirect("/login");
  }

  const order = await db.serviceOrder.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            include: {
              inventory: { select: { currentStock: true } },
            },
          },
        },
      },
      partner: true,
      technician: true,
      warehouseSpecialist: true,
      history: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) {
    return (
      <div style={{ padding: "32px", textAlign: "center" }}>
        <h1>Zamówienie nie znalezione</h1>
        <Link href="/warehouse" style={{ color: "var(--brand)", textDecoration: "none" }}>
          ← Wróć do listy
        </Link>
      </div>
    );
  }

  // Calculate totals
  const itemsTotal = order.items.reduce((sum, item) => {
    const unitPrice = item.unitPrice ? parseFloat(item.unitPrice.toString()) : 0;
    return sum + unitPrice * item.quantity;
  }, 0);

  const discountsTotal = order.items.reduce((sum, item) => {
    const discountValue = item.discountValue ? parseFloat(item.discountValue.toString()) : 0;
    const quantity = item.quantity || 1;
    if (item.discountType === "PERCENT") {
      const unitPrice = item.unitPrice ? parseFloat(item.unitPrice.toString()) : 0;
      return sum + (unitPrice * quantity * discountValue) / 100;
    }
    return sum + discountValue * quantity;
  }, 0);

  const finalTotal = itemsTotal - discountsTotal;

  const statusColor: Record<string, string> = {
    NOWE: "var(--ink-3)",
    PRZYJĘTE: "var(--brand)",
    CZĘŚCIOWO_ZREALIZOWANE: "var(--info)",
    ZREALIZOWANE: "var(--ok)",
    ODRZUCONE: "var(--danger)",
    ZAWIESZONE: "var(--warn)",
  };

  return (
    <div style={{ padding: "32px", maxWidth: "1000px" }}>
      {/* Breadcrumbs */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink-3)" }}>
        <Link href="/warehouse" style={{ color: "var(--brand)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
          <Icon name="clipboard" size={14} />
          Zamówienia
        </Link>
        <span>→</span>
        <span style={{ color: "var(--ink)", fontWeight: 500 }}>{order.code}</span>
      </div>

      <Link href="/warehouse" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, color: "var(--brand)", textDecoration: "none" }}>
        <Icon name="arrow-left" size={16} />
        Wróć do listy
      </Link>

      {/* Header */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
        <div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 4, fontWeight: 600 }}>Kod zamówienia</div>
            <div style={{ fontSize: 18, fontWeight: 600, fontFamily: "monospace" }}>{order.code}</div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 4, fontWeight: 600 }}>Status</div>
            <div
              style={{
                display: "inline-block",
                fontSize: 13,
                padding: "4px 8px",
                background: "var(--surface-2)",
                color: statusColor[order.status] || "var(--ink)",
                borderRadius: "var(--r-sm)",
                fontWeight: 500,
              }}
            >
              {order.status}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 4, fontWeight: 600 }}>Data utworzenia</div>
            <div style={{ fontSize: 14 }}>{new Date(order.createdAt).toLocaleDateString("pl")}</div>
          </div>

          <div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 4, fontWeight: 600 }}>Wymagana data dostawy</div>
            <div style={{ fontSize: 14 }}>
              {order.neededDate ? new Date(order.neededDate).toLocaleDateString("pl") : "—"}
            </div>
          </div>
        </div>

        <div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 4, fontWeight: 600 }}>Partner</div>
            <div style={{ fontSize: 14 }}>{order.partner?.name || "—"}</div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 4, fontWeight: 600 }}>Technik serwisowy</div>
            <div style={{ fontSize: 14 }}>{order.technician?.email || "—"}</div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 4, fontWeight: 600 }}>Magazynier</div>
            <div style={{ fontSize: 14 }}>{order.warehouseSpecialist?.email || "—"}</div>
          </div>

          <div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 4, fontWeight: 600 }}>Numer śledzenia</div>
            <div style={{ fontSize: 14, fontFamily: "monospace" }}>{order.trackingNumber || "—"}</div>
          </div>
        </div>
      </div>

      {/* Items with Pricing */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>Pozycje zamówienia — Wycena</h2>
        {order.items.length > 0 ? (
          <OrderPricingClient
            orderId={order.id}
            items={order.items.map((item) => ({
              id: item.id,
              productId: item.productId,
              product: {
                id: item.product.id,
                sku: item.product.sku,
                name: item.product.name,
                costPrice: item.product.costPrice ? parseFloat(item.product.costPrice.toString()) : null,
                sellingPrice: item.product.sellingPrice ? parseFloat(item.product.sellingPrice.toString()) : null,
                inStock: item.product.inStock,
                inventory: item.product.inventory,
              },
              quantity: item.quantity,
              unitPrice: item.unitPrice ? parseFloat(item.unitPrice.toString()) : null,
              currency: item.currency,
              exchangeRate: parseFloat(item.exchangeRate.toString()),
              discountType: item.discountType,
              discountValue: item.discountValue ? parseFloat(item.discountValue.toString()) : null,
              finalPrice: item.finalPrice ? parseFloat(item.finalPrice.toString()) : null,
              costPrice: item.costPrice ? parseFloat(item.costPrice.toString()) : null,
              notes: item.notes,
            }))}
            partner={{
              id: order.partner.id,
              name: order.partner.name,
              currency: order.partner.currency,
              minProfitMargin: order.partner.minProfitMargin ? parseFloat(order.partner.minProfitMargin.toString()) : 10,
            }}
          />
        ) : (
          <div style={{ padding: 32, textAlign: "center", background: "var(--surface-2)", borderRadius: "var(--r)", color: "var(--ink-3)" }}>
            Brak pozycji
          </div>
        )}
      </div>

      {/* Summary */}
      <div style={{ background: "var(--paper)", border: "1px solid var(--ink-2)", borderRadius: "var(--r)", padding: 24, marginBottom: 32 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: "var(--ink-3)" }}>Wartość pozycji:</span>
                <span style={{ fontWeight: 600 }}>{itemsTotal.toFixed(2)} zł</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: "var(--ink-3)" }}>Rabaty:</span>
                <span style={{ fontWeight: 600, color: "var(--warn)" }}>-{discountsTotal.toFixed(2)} zł</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: 8,
                  borderTop: "1px solid var(--ink-2)",
                }}
              >
                <span style={{ fontWeight: 600 }}>Do zapłaty:</span>
                <span style={{ fontSize: 16, fontWeight: 600, color: "var(--brand)" }}>{finalTotal.toFixed(2)} zł</span>
              </div>
            </div>
          </div>

          {order.notes && (
            <div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 8, fontWeight: 600 }}>Uwagi</div>
              <div style={{ fontSize: 13, color: "var(--ink-2)", whiteSpace: "pre-wrap" }}>{order.notes}</div>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      {order.history.length > 0 && (
        <div>
          <h2 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>Historia zmian</h2>
          <div style={{ background: "var(--paper)", border: "1px solid var(--ink-2)", borderRadius: "var(--r)", overflow: "hidden" }}>
            {order.history.map((hist, idx) => (
              <div
                key={hist.id}
                style={{
                  padding: 16,
                  borderBottom: idx < order.history.length - 1 ? "1px solid var(--ink-2)" : "none",
                  fontSize: 13,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{hist.action}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
                      Autor: {hist.changedBy} • {new Date(hist.createdAt).toLocaleDateString("pl")} o{" "}
                      {new Date(hist.createdAt).toLocaleTimeString("pl")}
                    </div>
                  </div>
                </div>
                {hist.notes && (
                  <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink-2)", fontStyle: "italic" }}>
                    {hist.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
