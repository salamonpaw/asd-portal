import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/authz";
import { num, orderView, fmtMoney } from "@/lib/pricing";
import { canDo } from "@/lib/service-orders/status";
import { defaultDiscounts, ratesFor, itemNumbers } from "@/lib/service-orders/server";
import { KV, SectionCard } from "@/components/ui";
import { OrderStatusBadge } from "@/components/portal/OrderStatusBadge";
import { OrderPricingClient } from "./OrderPricingClient";
import { OrderWorkflowClient } from "./OrderWorkflowClient";

export const revalidate = 0;

export default async function WarehouseOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageRole("WAREHOUSE_SPECIALIST", "ADMIN");
  const { id } = await params;

  const order = await db.serviceOrder.findUnique({
    where: { id },
    include: {
      items: { include: { product: { include: { inventory: { select: { currentStock: true } } } } }, orderBy: { createdAt: "asc" } },
      partner: { select: { id: true, name: true, currency: true, minProfitMargin: true } },
      technician: { select: { name: true, email: true } },
      warehouseSpecialist: { select: { name: true, email: true } },
      parentOrder: { select: { id: true, code: true } },
      childOrders: { select: { id: true, code: true, status: true, expectedDate: true } },
      history: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!order) notFound();

  const items = order.items.map(itemNumbers);
  const view = orderView(items);
  const editable = canDo(order.status, "price");
  const [defaults, rates] = editable
    ? await Promise.all([defaultDiscounts(order.partnerId, items.map((i) => i.productId)), ratesFor(order.partnerId)])
    : [{}, {}];

  return (
    <div className="fadeup" style={{ maxWidth: 1180 }}>
      <Link href="/warehouse" className="backlink">← Zamówienia</Link>

      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", margin: "12px 0 22px" }}>
        <h1 style={{ fontSize: 26, fontFamily: "var(--font-mono)" }}>{order.code}</h1>
        <OrderStatusBadge status={order.status} expectedDate={order.expectedDate} />
        {view.priced && <span style={{ fontSize: 15, fontWeight: 700, color: "var(--brand)" }}>{fmtMoney(view.total, order.currency)}</span>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 20, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
          <SectionCard title="Zamówienie">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16 }}>
              <KV label="Partner">{order.partner.name}</KV>
              <KV label="Serwisant">{order.technician.name}<div style={{ fontSize: 12.5, color: "var(--ink-3)", fontWeight: 400 }}>{order.technician.email}</div></KV>
              <KV label="Utworzone">{order.createdAt.toLocaleDateString("pl-PL")}</KV>
              <KV label="Potrzebne do">{order.neededDate ? order.neededDate.toLocaleDateString("pl-PL") : "—"}</KV>
              <KV label="Adres dostawy"><span style={{ fontWeight: 400, whiteSpace: "pre-wrap" }}>{order.deliveryAddress}</span></KV>
              <KV label="Magazynier">{order.warehouseSpecialist?.name ?? "—"}</KV>
            </div>
            {order.notes && <div style={{ marginTop: 16 }}><KV label="Uwagi serwisanta"><span style={{ fontWeight: 400, whiteSpace: "pre-wrap" }}>{order.notes}</span></KV></div>}
            {order.rejectionReason && <div style={{ marginTop: 16 }}><KV label="Powód odrzucenia"><span style={{ fontWeight: 400, color: "#97271b" }}>{order.rejectionReason}</span></KV></div>}
            {(order.parentOrder || order.childOrders.length > 0) && (
              <div className="nip-note" style={{ background: "var(--surface-2)", color: "var(--ink-2)" }}>
                {order.parentOrder && <span>Brakujące części z zamówienia <Link href={`/warehouse/orders/${order.parentOrder.id}`} style={{ fontWeight: 700 }}>{order.parentOrder.code}</Link>.</span>}
                {order.childOrders.map((c) => (
                  <span key={c.id}>Brakujące części przeniesiono do <Link href={`/warehouse/orders/${c.id}`} style={{ fontWeight: 700 }}>{c.code}</Link> <OrderStatusBadge status={c.status} expectedDate={c.expectedDate} /></span>
                ))}
              </div>
            )}
          </SectionCard>

          <OrderPricingClient
            orderId={order.id}
            editable={editable}
            userName={user.name}
            currency={order.currency}
            partnerCurrency={order.partner.currency}
            minMargin={num(order.partner.minProfitMargin) ?? 0}
            pricedAt={order.pricedAt?.toISOString() ?? null}
            rates={rates}
            items={items.map((i) => ({
              id: i.id,
              productId: i.productId,
              manualPrice: i.manualPrice,
              sku: i.product.sku,
              name: i.product.name,
              quantity: i.quantity,
              stock: i.product.inventory?.currentStock ?? 0,
              catalogPrice: num(i.product.sellingPrice),
              catalogCost: num(i.product.costPrice),
              unitPrice: i.unitPrice,
              costPrice: i.costPrice,
              discountType: i.discountType,
              discountValue: i.discountValue,
              finalPrice: i.finalPrice,
              suggested: (defaults as Record<string, { value: number; source: string }>)[i.productId] ?? null,
            }))}
          />

          <SectionCard title="Historia">
            {order.history.length === 0 ? <div style={{ color: "var(--ink-3)", fontSize: 14 }}>Brak wpisów.</div> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {order.history.map((h) => (
                  <div key={h.id} style={{ fontSize: 13.5, borderBottom: "1px solid var(--line)", paddingBottom: 10 }}>
                    <div><b>{h.action.replaceAll("_", " ").toLowerCase()}</b>{h.notes ? ` — ${h.notes}` : ""}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{h.changedBy} · {h.createdAt.toLocaleString("pl-PL")}</div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <OrderWorkflowClient
          orderId={order.id}
          status={order.status}
          trackingNumber={order.trackingNumber}
          expectedDate={order.expectedDate?.toISOString().slice(0, 10) ?? null}
          priced={view.priced}
        />
      </div>
    </div>
  );
}
