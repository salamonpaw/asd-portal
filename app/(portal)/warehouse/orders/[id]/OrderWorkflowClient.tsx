"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ServiceOrderStatus } from "@prisma/client";
import { Modal, Field } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { canDo, STATUS_META } from "@/lib/service-orders/status";
import {
  changeServiceOrderStatus, previewFulfillment, fulfillServiceOrder, setTrackingNumber, setExpectedDate,
} from "@/lib/actions/service-orders";
import type { PlanLine } from "@/lib/service-orders/server";

type Msg = { ok: boolean; text: string } | null;

export function OrderWorkflowClient({ orderId, status, trackingNumber, expectedDate, priced }: {
  orderId: string;
  status: ServiceOrderStatus;
  trackingNumber: string | null;
  expectedDate: string | null;
  priced: boolean;
}) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [msg, setMsg] = useState<Msg>(null);
  const [reject, setReject] = useState<string | null>(null);
  const [plan, setPlan] = useState<{ lines: PlanLine[]; priced: boolean } | null>(null);
  const [date, setDate] = useState(expectedDate ?? "");
  const [tracking, setTracking] = useState(trackingNumber ?? "");
  const today = new Date().toISOString().slice(0, 10);

  const run = (fn: () => Promise<{ success: boolean; error?: string; data?: unknown }>, ok: string, after?: () => void) =>
    start(async () => {
      setMsg(null);
      const r = await fn();
      setMsg(r.success ? { ok: true, text: ok } : { ok: false, text: r.error ?? "Błąd" });
      if (r.success) { after?.(); router.refresh(); }
    });

  async function openFulfill() {
    setMsg(null);
    const r = await previewFulfillment(orderId);
    if (!r.success) return setMsg({ ok: false, text: r.error });
    setPlan(r.data!);
  }

  const goPricing = () => { setPlan(null); document.getElementById("wycena")?.scrollIntoView({ behavior: "smooth", block: "start" }); };

  const waiting = plan ? plan.lines.reduce((s, l) => s + l.wait, 0) : 0;
  const shipping = plan ? plan.lines.reduce((s, l) => s + l.ship, 0) : 0;

  return (
    <div className="card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 16 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".05em" }}>Obsługa zamówienia</div>
      <div style={{ fontSize: 13, color: "var(--ink-3)" }}>{STATUS_META[status].hint}</div>

      {canDo(status, "fulfill") && (
        <button className="btn btn-ok" disabled={busy} onClick={openFulfill}>
          <Icon name="send" size={15} />{status === "OCZEKUJE_NA_CZESCI" ? "Części dotarły — wyślij" : "Zrealizuj (wydaj z magazynu)"}
        </button>
      )}
      {!priced && canDo(status, "fulfill") && (
        <div style={{ fontSize: 12.5, color: "#845509" }}>
          Wycena nie jest zapisana — wysyłane części muszą mieć zapisaną cenę.{" "}
          <button type="button" onClick={goPricing} style={{ background: "none", border: "none", padding: 0, color: "var(--brand)", fontWeight: 600, cursor: "pointer", fontSize: 12.5 }}>Przejdź do wyceny ↓</button>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {canDo(status, "approve") && <button className="btn btn-soft btn-sm" disabled={busy} onClick={() => run(() => changeServiceOrderStatus(orderId, "approve"), "Przyjęto zamówienie.")}>Przyjmij</button>}
        {canDo(status, "resume") && <button className="btn btn-soft btn-sm" disabled={busy} onClick={() => run(() => changeServiceOrderStatus(orderId, "resume"), "Wznowiono.")}>Wznów</button>}
        {canDo(status, "suspend") && <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => run(() => changeServiceOrderStatus(orderId, "suspend"), "Zawieszono.")}>Zawieś</button>}
        {canDo(status, "reject") && <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} disabled={busy} onClick={() => setReject("")}>Odrzuć</button>}
      </div>

      {status === "OCZEKUJE_NA_CZESCI" && (
        <Field label="Przewidywana dostępność" hint="Widzi ją serwisant i partner">
          <div style={{ display: "flex", gap: 6 }}>
            <input className="input" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
            <button className="btn btn-soft btn-sm" disabled={busy || !date || date === expectedDate} onClick={() => run(() => setExpectedDate(orderId, date), "Zmieniono termin.")}>Zapisz</button>
          </div>
        </Field>
      )}

      {status !== "ODRZUCONE" && (
        <Field label="Numer przesyłki">
          <div style={{ display: "flex", gap: 6 }}>
            <input className="input" value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="np. 6200123456789" />
            <button className="btn btn-soft btn-sm" disabled={busy || tracking === (trackingNumber ?? "")} onClick={() => run(() => setTrackingNumber(orderId, tracking), "Zapisano numer przesyłki.")}>Zapisz</button>
          </div>
        </Field>
      )}

      {msg && (
        <div className="nip-note" style={{ marginTop: 0, background: msg.ok ? "var(--ok-soft)" : "var(--danger-soft)", color: msg.ok ? "#14633f" : "#97271b" }}>
          <Icon name={msg.ok ? "checkCircle" : "alert"} size={18} />{msg.text}
        </div>
      )}

      {/* Odrzucenie */}
      <Modal open={reject !== null} onClose={() => setReject(null)} width={440}>
        <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
          <h3 style={{ fontSize: 18 }}>Odrzucić zamówienie?</h3>
          <Field label="Powód (zobaczy serwisant)" req>
            <textarea className="textarea" style={{ minHeight: 70 }} value={reject ?? ""} onChange={(e) => setReject(e.target.value)} autoFocus />
          </Field>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={() => setReject(null)}>Anuluj</button>
            <button className="btn btn-danger" disabled={busy || !reject?.trim()} onClick={() => run(() => changeServiceOrderStatus(orderId, "reject", reject ?? ""), "Odrzucono zamówienie.", () => setReject(null))}>Odrzuć</button>
          </div>
        </div>
      </Modal>

      {/* Realizacja — podgląd z bieżącymi stanami */}
      <Modal open={!!plan} onClose={() => setPlan(null)} width={620}>
        {plan && (
          <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
            <h3 style={{ fontSize: 18 }}>Realizacja zamówienia</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
              <thead>
                <tr style={{ color: "var(--ink-3)", fontSize: 11.5, textTransform: "uppercase" }}>
                  <th style={{ textAlign: "left", padding: 6 }}>Część</th>
                  <th style={{ textAlign: "right", padding: 6 }}>Zam.</th>
                  <th style={{ textAlign: "right", padding: 6 }}>Stan</th>
                  <th style={{ textAlign: "right", padding: 6 }}>Wysyłam</th>
                  <th style={{ textAlign: "right", padding: 6 }}>Czeka</th>
                </tr>
              </thead>
              <tbody>
                {plan.lines.map((l) => (
                  <tr key={l.itemId} style={{ borderTop: "1px solid var(--line)" }}>
                    <td style={{ padding: 6 }}>{l.name} <span className="mono" style={{ color: "var(--ink-3)", fontSize: 12 }}>{l.sku}</span></td>
                    <td style={{ padding: 6, textAlign: "right" }}>{l.ordered}</td>
                    <td style={{ padding: 6, textAlign: "right" }}>{l.stock}</td>
                    <td style={{ padding: 6, textAlign: "right", fontWeight: 700, color: "#14633f" }}>{l.ship}</td>
                    <td style={{ padding: 6, textAlign: "right", fontWeight: 700, color: l.wait ? "#845509" : "var(--ink-4)" }}>{l.wait}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ fontSize: 13.5, color: "var(--ink-2)" }}>
              {waiting === 0 && "Wszystkie części są na stanie — zamówienie zostanie zrealizowane w całości."}
              {waiting > 0 && shipping > 0 && `Wysyłam ${shipping} szt. Brakujące ${waiting} szt. trafią do nowego zamówienia „Oczekuje na części”.`}
              {shipping === 0 && "Żadnej części nie ma na stanie — zamówienie otrzyma status „Oczekuje na części”."}
            </div>
            {waiting > 0 && (
              <Field label="Przewidywana dostępność brakujących części" req hint="Zobaczy ją serwisant i partner">
                <input className="input" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
            )}
            {shipping > 0 && !plan.priced && (
              <div className="nip-note" style={{ marginTop: 0, background: "var(--danger-soft)", color: "#97271b" }}>
                <Icon name="alert" size={18} />
                <span>
                  Wycena nie jest zapisana. W sekcji „Wycena” kliknij <b>Zapisz wycenę</b> (przy cenie ręcznej lub niskiej marży najpierw zaznacz potwierdzenie „na własną odpowiedzialność”).{" "}
                  <button type="button" onClick={goPricing} style={{ background: "none", border: "none", padding: 0, color: "inherit", fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}>Przejdź do wyceny</button>
                </span>
              </div>
            )}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setPlan(null)}>Anuluj</button>
              <button
                className="btn btn-ok"
                disabled={busy || (waiting > 0 && !date) || (shipping > 0 && !plan.priced)}
                onClick={() => start(async () => {
                  const r = await fulfillServiceOrder(orderId, { expectedDate: waiting > 0 ? date : undefined });
                  setPlan(null);
                  if (!r.success) return setMsg({ ok: false, text: r.error });
                  setMsg({ ok: true, text: r.data?.childCode ? `Wysłano dostępne części. Brakujące → ${r.data.childCode}.` : `Status: ${STATUS_META[r.data!.status as ServiceOrderStatus].label}.` });
                  router.refresh();
                })}
              >
                {busy ? "Realizuję…" : "Potwierdź"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
