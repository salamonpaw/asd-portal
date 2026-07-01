import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export const revalidate = 0;

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;

  if (!session || userRole !== "SERVICE_TECHNICIAN") {
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
        <Link href="/service-technician/dashboard" style={{ color: "var(--brand)", textDecoration: "none" }}>
          ← Wróć do listy
        </Link>
      </div>
    );
  }

  // Calculate totals
  let itemsTotal = 0;
  let discountsTotal = 0;

  order.items.forEach((item) => {
    const quantity = item.quantity || 1;
    const unitPrice = item.unitPrice
      ? parseFloat(item.unitPrice.toString())
      : parseFloat(item.product?.sellingPrice?.toString() || "0");
    const discountValue = item.discountValue ? parseFloat(item.discountValue.toString()) : 0;

    const grossPrice = unitPrice * quantity;
    itemsTotal += grossPrice;

    if (discountValue > 0 && item.discountType) {
      if (item.discountType === "PERCENT") {
        discountsTotal += (grossPrice * discountValue) / 100;
      } else if (item.discountType === "AMOUNT") {
        discountsTotal += discountValue * quantity;
      }
    }
  });

  const finalTotal = itemsTotal - discountsTotal;

  const statusColor: Record<string, string> = {
    NOWE: "var(--ink-3)",
    PRZYJĘTE: "var(--brand)",
    CZĘŚCIOWO_ZREALIZOWANE: "var(--info)",
    ZREALIZOWANE: "var(--ok)",
    ODRZUCONE: "var(--danger)",
    ZAWIESZONE: "var(--warn)",
  };

  const statusLabel: Record<string, string> = {
    NOWE: "Nowe",
    PRZYJĘTE: "Przyjęte",
    CZĘŚCIOWO_ZREALIZOWANE: "Częściowo zrealizowane",
    ZREALIZOWANE: "Zrealizowane",
    ODRZUCONE: "Odrzucone",
    ZAWIESZONE: "Zawieszone",
  };

  return (
    <div style={{ padding: "32px", maxWidth: "1000px" }}>
      {/* Breadcrumbs */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink-3)" }}>
        <Link href="/service-technician/dashboard" style={{ color: "var(--brand)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
          <Icon name="clipboard" size={14} />
          Moje zamówienia
        </Link>
        <span>→</span>
        <span style={{ color: "var(--ink)", fontWeight: 500 }}>{order.code}</span>
      </div>

      <Link href="/service-technician/dashboard" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, color: "var(--brand)", textDecoration: "none" }}>
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
                padding: "6px 12px",
                background: "var(--surface-2)",
                color: statusColor[order.status] || "var(--ink)",
                borderRadius: "var(--r-sm)",
                fontWeight: 500,
              }}
            >
              {statusLabel[order.status] || order.status}
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
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 4, fontWeight: 600 }}>Twoja rola</div>
            <div style={{ fontSize: 14 }}>Technik serwisowy</div>
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

      {/* Items */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>Pozycje zamówienia</h2>
        {order.items.length > 0 ? (
          <div style={{ background: "var(--paper)", border: "1px solid var(--ink-2)", borderRadius: "var(--r)", overflow: "hidden" }}>
            {order.items.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  padding: 16,
                  borderBottom: idx < order.items.length - 1 ? "1px solid var(--ink-2)" : "none",
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
                  gap: 16,
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.product.name}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)" }}>SKU: {item.product.sku}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 2 }}>Ilość</div>
                  <div style={{ fontWeight: 600 }}>{item.quantity} szt.</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 2 }}>Cena jedn.</div>
                  <div style={{ fontWeight: 600 }}>
                    {(item.unitPrice ? parseFloat(item.unitPrice.toString()) : parseFloat(item.product.sellingPrice?.toString() || "0")).toFixed(2)} {item.currency || "PLN"}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 2 }}>Rabat</div>
                  {item.discountValue ? (
                    <div style={{ fontWeight: 600, color: "var(--warn)" }}>
                      {item.discountType === "PERCENT" ? `${item.discountValue}%` : `${item.discountValue} ${item.currency || "PLN"}`}
                    </div>
                  ) : (
                    <div style={{ color: "var(--ink-3)" }}>—</div>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 2 }}>Razem</div>
                  <div style={{ fontWeight: 600, color: "var(--brand)" }}>
                    {(item.finalPrice ? parseFloat(item.finalPrice.toString()) : parseFloat(item.unitPrice?.toString() || item.product.sellingPrice?.toString() || "0")).toFixed(2)} {item.currency || "PLN"}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 2 }}>📦 Magazyn</div>
                  <div
                    style={{
                      fontWeight: 600,
                      color: ((item.product.inventory as any)?.currentStock || 0) >= item.quantity ? "var(--success)" : "var(--warn)",
                    }}
                  >
                    {(item.product.inventory as any)?.currentStock || 0} szt.
                  </div>
                </div>
              </div>
            ))}
          </div>
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
