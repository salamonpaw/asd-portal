import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrdersByPartner } from "@/lib/actions/orders";
import { SectionCard, Icon } from "@/components/ui";
import Link from "next/link";
import { fmtDate } from "@/lib/dates";

const statusBadges: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: "#F7ECD5", color: "#845509", label: "Oczekujące" },
  confirmed: { bg: "#E8F5FF", color: "#004B9A", label: "Potwierdzone" },
  in_progress: { bg: "#F0F2FF", color: "#3730A3", label: "W trakcie" },
  awaiting_info: { bg: "#FFF4E6", color: "#92400E", label: "Czekamy na info" },
  ready: { bg: "#DBEAFE", color: "#1e40af", label: "Gotowe" },
  delivered: { bg: "#E2F0E9", color: "#14633f", label: "Dostarczone" },
};

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session || !["PARTNER"].includes(session.user?.role))
    return redirect("/");

  const partnerId = session.user.partnerId;
  if (!partnerId) return redirect("/");

  const result = await getOrdersByPartner(partnerId);

  if (!result.success || !result.data) return redirect("/");
  const orders = result.data;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Moje zamówienia</h1>

      {orders.length === 0 ? (
        <SectionCard>
          <div style={{ textAlign: "center", padding: 40, color: "#767B86" }}>
            <Icon name="inbox" size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <p>Brak zamówień. Zacznij od złożenia zamówienia do projektu.</p>
          </div>
        </SectionCard>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {orders.map((order: any) => {
            const badge = statusBadges[order.status] || statusBadges.pending;
            return (
              <SectionCard key={order.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <span style={{ fontSize: 16, fontWeight: 600 }}>{order.code}</span>
                      <span
                        style={{
                          display: "inline-block",
                          background: badge.bg,
                          color: badge.color,
                          padding: "4px 10px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <p style={{ margin: "4px 0", fontSize: 14, color: "#767B86" }}>
                      Projekt: <strong>{order.project.customerName}</strong>
                    </p>
                    <p style={{ margin: "4px 0", fontSize: 13, color: "#9AA0AB" }}>
                      Utworzono: {fmtDate(order.createdAt)}
                    </p>
                    {order.deliveryDate && (
                      <p style={{ margin: "4px 0", fontSize: 13, color: "#9AA0AB" }}>
                        Termin dostawy: <strong>{fmtDate(order.deliveryDate)}</strong>
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/partner/orders/${order.id}`}
                    style={{
                      padding: "8px 16px",
                      background: "#22356B",
                      color: "#fff",
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Szczegóły →
                  </Link>
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
