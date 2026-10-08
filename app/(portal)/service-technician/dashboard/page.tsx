import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/authz";
import { orderView, fmtMoney } from "@/lib/pricing";
import { itemNumbers } from "@/lib/service-orders/server";
import { PageHead, StatCard, EmptyState } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { OrderStatusBadge } from "@/components/portal/OrderStatusBadge";

export const revalidate = 0;

export default async function ServiceTechnicianDashboard() {
  const user = await requirePageRole("SERVICE_TECHNICIAN");

  const orders = await db.serviceOrder.findMany({
    where: { technicianId: user.id },
    include: { items: { include: { product: { select: { name: true, sku: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  const rows = orders.map((o) => ({ ...o, view: orderView(o.items.map(itemNumbers)) }));
  const open = rows.filter((o) => ["NOWE", "PRZYJĘTE", "ZAWIESZONE"].includes(o.status)).length;
  const waiting = rows.filter((o) => o.status === "OCZEKUJE_NA_CZESCI").length;
  const done = rows.filter((o) => o.status === "ZREALIZOWANE" || o.status === "CZĘŚCIOWO_ZREALIZOWANE").length;

  return (
    <div className="fadeup">
      <PageHead title="Moje zamówienia części" sub="Status, wycena i termin dostawy Twoich zamówień.">
        <Link href="/service-technician/products" className="btn btn-primary"><Icon name="plus" size={16} />Zamów części</Link>
      </PageHead>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
        <StatCard icon="layers" label="Wszystkie" value={rows.length} />
        <StatCard icon="clock" label="W realizacji" value={open} tone="var(--brand)" />
        <StatCard icon="alert" label="Czeka na części" value={waiting} tone="var(--warn)" soft="var(--warn-soft)" />
        <StatCard icon="checkCircle" label="Zrealizowane" value={done} tone="var(--ok)" soft="var(--ok-soft)" />
      </div>

      <div className="card">
        {rows.length === 0 ? (
          <EmptyState icon="layers" title="Brak zamówień" sub="Zamów pierwsze części w zakładce Zamów części." />
        ) : rows.map((o) => (
          <Link key={o.id} href={`/service-technician/orders/${o.id}`} className="attn-row" style={{ alignItems: "flex-start", textDecoration: "none", color: "inherit" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <span className="mono" style={{ fontWeight: 700 }}>{o.code}</span>
                <OrderStatusBadge status={o.status} expectedDate={o.expectedDate} />
              </div>
              <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 6 }}>
                {o.items.slice(0, 3).map((i) => `${i.product.name} × ${i.quantity}`).join(" · ")}{o.items.length > 3 ? ` · +${o.items.length - 3}` : ""}
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>{o.createdAt.toLocaleDateString("pl-PL")}{o.trackingNumber ? ` · przesyłka ${o.trackingNumber}` : ""}</div>
            </div>
            <div style={{ textAlign: "right", whiteSpace: "nowrap", fontWeight: 700 }}>
              {o.view.priced ? fmtMoney(o.view.total, o.currency) : <span style={{ fontSize: 12.5, fontWeight: 600, color: "#845509" }}>oczekuje na wycenę</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
