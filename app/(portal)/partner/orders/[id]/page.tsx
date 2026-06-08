import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrder } from "@/lib/actions/orders";
import { SectionCard, Icon } from "@/components/ui";
import { fmtDate } from "@/lib/dates";
import Link from "next/link";

const waitingItemTypeLabel: Record<string, string> = {
  drum_config: "Konfiguracja siatki bębna",
  reader: "Czytnik",
  card_reading: "Odczyty kart",
  card_samples: "Próbki kart",
  tracking: "Tracking numer wysyłki",
};

const waitingItemStatusBadge: Record<string, { bg: string; color: string }> = {
  pending: { bg: "#F7ECD5", color: "#845509" },
  received: { bg: "#E8F5FF", color: "#004B9A" },
  in_progress: { bg: "#F0F2FF", color: "#3730A3" },
  done: { bg: "#E2F0E9", color: "#14633f" },
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !["PARTNER"].includes((session.user as any)?.role))
    return redirect("/");

  const { id } = await params;
  const order = await getOrder(id);

  if (!order) return redirect("/partner/orders");

  const partnerId = (session.user as any).partnerId;
  if (order.project.partnerId !== partnerId) return redirect("/partner/orders");

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Link href="/partner/orders" style={{ color: "#22356B", textDecoration: "none" }}>
          ← Wróć
        </Link>
        <h1 style={{ margin: 0 }}>{order.code}</h1>
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        {/* Order Info */}
        <SectionCard title="Informacje o zamówieniu">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <p style={{ fontSize: 12, color: "#9AA0AB", marginBottom: 4 }}>Projekt</p>
              <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>
                {order.project.customerName}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 12, color: "#9AA0AB", marginBottom: 4 }}>Status</p>
              <p style={{ fontSize: 15, fontWeight: 600, margin: 0, textTransform: "capitalize" }}>
                {order.status}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 12, color: "#9AA0AB", marginBottom: 4 }}>Utworzono</p>
              <p style={{ fontSize: 15, margin: 0 }}>
                {fmtDate(order.createdAt)}
              </p>
            </div>
            {order.deliveryDate && (
              <div>
                <p style={{ fontSize: 12, color: "#9AA0AB", marginBottom: 4 }}>Termin dostawy</p>
                <p style={{ fontSize: 15, fontWeight: 600, margin: 0, color: "#1E8A5A" }}>
                  {fmtDate(order.deliveryDate)}
                </p>
              </div>
            )}
            {order.estimatedDays && (
              <div>
                <p style={{ fontSize: 12, color: "#9AA0AB", marginBottom: 4 }}>Estymowana liczba dni</p>
                <p style={{ fontSize: 15, margin: 0 }}>
                  {order.estimatedDays} dni
                </p>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Supervisors */}
        <SectionCard title="Opiekunowie">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <p style={{ fontSize: 12, color: "#9AA0AB", marginBottom: 4 }}>Reprezentant handlowy</p>
              <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>
                {order.supervisorRep?.name || "Nie przypisano"}
              </p>
              {order.supervisorRep?.email && (
                <p style={{ fontSize: 13, color: "#767B86", margin: "4px 0 0 0" }}>
                  {order.supervisorRep.email}
                </p>
              )}
            </div>
            <div>
              <p style={{ fontSize: 12, color: "#9AA0AB", marginBottom: 4 }}>Opiekun wdrażania (BOK)</p>
              <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>
                {order.supervisorBok?.name || "Nie przypisano"}
              </p>
              {order.supervisorBok?.email && (
                <p style={{ fontSize: 13, color: "#767B86", margin: "4px 0 0 0" }}>
                  {order.supervisorBok.email}
                </p>
              )}
            </div>
          </div>
        </SectionCard>

        {/* Waiting Items */}
        <SectionCard title="Na co czekamy?">
          {order.waitingFor.length === 0 ? (
            <p style={{ color: "#767B86", margin: 0 }}>
              Brak otwartych elementów do realizacji.
            </p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {order.waitingFor.map((item: any) => {
                const badge =
                  waitingItemStatusBadge[item.status] ||
                  waitingItemStatusBadge.pending;
                return (
                  <div
                    key={item.id}
                    style={{
                      padding: 12,
                      background: "#F4F2EC",
                      borderRadius: 8,
                      border: "1px solid #E3E0D7",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px 0" }}>
                          {waitingItemTypeLabel[item.type] || item.type}
                        </p>
                        <span
                          style={{
                            display: "inline-block",
                            background: badge.bg,
                            color: badge.color,
                            padding: "3px 8px",
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 600,
                            marginBottom: 8,
                          }}
                        >
                          {item.status}
                        </span>
                        {item.note && (
                          <p style={{ fontSize: 13, color: "#767B86", margin: "4px 0 0 0" }}>
                            {item.note}
                          </p>
                        )}
                        {item.trackingNumber && (
                          <p style={{ fontSize: 13, color: "#474C58", margin: "4px 0 0 0" }}>
                            <strong>Tracking:</strong> {item.trackingNumber}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* Back to Project */}
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <Link
            href={`/partner/projects/${order.projectId}`}
            style={{
              color: "#22356B",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            ← Wróć do projektu
          </Link>
        </div>
      </div>
    </div>
  );
}
