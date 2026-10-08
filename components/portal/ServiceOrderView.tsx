import Link from "next/link";
import { db } from "@/lib/db";
import { lineView, orderView, fmtMoney } from "@/lib/pricing";
import { STATUS_META } from "@/lib/service-orders/status";
import { itemNumbers } from "@/lib/service-orders/server";
import { KV, SectionCard } from "@/components/ui";
import { OrderStatusBadge } from "@/components/portal/OrderStatusBadge";

/**
 * Zamówienie części — widok dla serwisanta i partnera (tylko odczyt).
 * Dostęp ograniczony do zamówień własnej firmy; bez cen zakupu, marży i wewnętrznych notatek wyceny.
 */
export async function ServiceOrderView({ orderId, partnerId, basePath, backHref }: { orderId: string; partnerId: string; basePath: string; backHref: string }) {
  const order = await db.serviceOrder.findFirst({
    where: { id: orderId, partnerId },
    include: {
      items: { include: { product: { select: { sku: true, name: true } } }, orderBy: { createdAt: "asc" } },
      technician: { select: { name: true } },
      parentOrder: { select: { id: true, code: true } },
      childOrders: { select: { id: true, code: true, status: true, expectedDate: true } },
      history: { orderBy: { createdAt: "desc" }, select: { id: true, action: true, notes: true, createdAt: true } },
    },
  });
  if (!order) return null;

  const items = order.items.map(itemNumbers);
  const view = orderView(items);
  const cur = order.currency;
  const th: React.CSSProperties = { textAlign: "left", fontSize: 11.5, textTransform: "uppercase", color: "var(--ink-3)", padding: "10px 8px" };
  const td: React.CSSProperties = { padding: "10px 8px", borderTop: "1px solid var(--line)", fontSize: 13.5 };
  const r: React.CSSProperties = { ...td, textAlign: "right", whiteSpace: "nowrap" };

  return (
    <div className="fadeup" style={{ maxWidth: 1000 }}>
      <Link href={backHref} className="backlink">← Zamówienia</Link>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", margin: "12px 0 22px" }}>
        <h1 style={{ fontSize: 26, fontFamily: "var(--font-mono)" }}>{order.code}</h1>
        <OrderStatusBadge status={order.status} expectedDate={order.expectedDate} />
      </div>

      {order.status === "OCZEKUJE_NA_CZESCI" && (
        <div className="nip-note" style={{ marginTop: 0, marginBottom: 18, background: "var(--warn-soft)", color: "#845509" }}>
          Części nie ma jeszcze na stanie.{" "}
          {order.expectedDate ? <>Przewidywana dostępność: <b>{order.expectedDate.toLocaleDateString("pl-PL")}</b>.</> : "Magazyn poda termin."}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <SectionCard title="Zamówienie">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16 }}>
            <KV label="Zamówił">{order.technician.name}</KV>
            <KV label="Utworzone">{order.createdAt.toLocaleDateString("pl-PL")}</KV>
            <KV label="Potrzebne do">{order.neededDate ? order.neededDate.toLocaleDateString("pl-PL") : "—"}</KV>
            <KV label="Numer przesyłki" mono>{order.trackingNumber || "—"}</KV>
            <KV label="Adres dostawy"><span style={{ fontWeight: 400, whiteSpace: "pre-wrap" }}>{order.deliveryAddress}</span></KV>
          </div>
          {order.notes && <div style={{ marginTop: 16 }}><KV label="Uwagi"><span style={{ fontWeight: 400, whiteSpace: "pre-wrap" }}>{order.notes}</span></KV></div>}
          {order.rejectionReason && <div style={{ marginTop: 16 }}><KV label="Powód odrzucenia"><span style={{ fontWeight: 400, color: "#97271b" }}>{order.rejectionReason}</span></KV></div>}
          {(order.parentOrder || order.childOrders.length > 0) && (
            <div className="nip-note" style={{ background: "var(--surface-2)", color: "var(--ink-2)" }}>
              {order.parentOrder && <span>Brakujące części z zamówienia <Link href={`${basePath}/${order.parentOrder.id}`} style={{ fontWeight: 700 }}>{order.parentOrder.code}</Link>.</span>}
              {order.childOrders.map((c) => (
                <span key={c.id}>Brakujące części wysyłamy osobno: <Link href={`${basePath}/${c.id}`} style={{ fontWeight: 700 }}>{c.code}</Link> <OrderStatusBadge status={c.status} expectedDate={c.expectedDate} /></span>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Części" action={<span style={{ fontSize: 12.5, fontWeight: 600, color: view.priced ? "#14633f" : "#845509" }}>{view.priced ? "Wycenione" : "Oczekuje na wycenę"}</span>}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={th}>Część</th><th style={{ ...th, textAlign: "right" }}>Ilość</th><th style={{ ...th, textAlign: "right" }}>Cena/szt.</th><th style={{ ...th, textAlign: "right" }}>Rabat</th><th style={{ ...th, textAlign: "right" }}>Wartość</th></tr></thead>
              <tbody>
                {items.map((i) => {
                  const v = lineView(i);
                  return (
                    <tr key={i.id}>
                      <td style={td}><div style={{ fontWeight: 600 }}>{i.product.name}</div><div className="mono" style={{ fontSize: 12, color: "var(--ink-3)" }}>{i.product.sku}</div></td>
                      <td style={r}>{i.quantity}</td>
                      <td style={r}>{v.priced ? fmtMoney(v.unitPrice, cur) : "—"}</td>
                      <td style={r}>{v.priced && v.discountPerUnit > 0 ? (i.discountType === "PERCENT" ? `${i.discountValue}%` : `${fmtMoney(v.discountPerUnit, cur)}/szt.`) : "—"}</td>
                      <td style={{ ...r, fontWeight: 600 }}>{v.priced ? fmtMoney(v.total, cur) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {view.pricedCount > 0 && (
            <div style={{ marginLeft: "auto", maxWidth: 280, marginTop: 14, fontSize: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Wartość katalogowa</span><span>{fmtMoney(view.gross, cur)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#845509" }}><span>Rabaty</span><span>−{fmtMoney(view.discount, cur)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16, marginTop: 6, color: "var(--brand)" }}><span>Do zapłaty</span><span>{fmtMoney(view.total, cur)}</span></div>
              {!view.priced && <div style={{ fontSize: 12, color: "#845509", marginTop: 4 }}>Część pozycji nie jest jeszcze wyceniona.</div>}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Historia">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {order.history.map((h) => {
              const known = STATUS_META[h.action as keyof typeof STATUS_META];
              // wycena: bez szczegółów (mogą zawierać informacje o marży)
              const notes = h.action === "WYCENA" ? "Zamówienie wycenione" : h.notes;
              return (
                <div key={h.id} style={{ fontSize: 13.5, borderBottom: "1px solid var(--line)", paddingBottom: 10 }}>
                  <div><b>{known ? known.label : h.action.replaceAll("_", " ").toLowerCase()}</b>{notes ? ` — ${notes}` : ""}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{h.createdAt.toLocaleString("pl-PL")}</div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
