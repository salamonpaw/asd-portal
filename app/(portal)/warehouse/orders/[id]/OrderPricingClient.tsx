"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SectionCard } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { priceServiceOrder } from "@/lib/actions/service-orders";
import { finalUnitPrice, lineView, orderView, fmtMoney, fmtPct, round2, type Currency, type DiscountType } from "@/lib/pricing";

type Item = {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  stock: number;
  catalogPrice: number | null; // PLN, bieżący katalog
  catalogCost: number | null;  // PLN
  unitPrice: number | null;    // zapisana wycena (waluta zamówienia)
  costPrice: number | null;
  discountType: DiscountType | null;
  discountValue: number | null;
  finalPrice: number | null;
  suggested: { value: number; source: string } | null;
};

const CURRENCIES: Currency[] = ["PLN", "EUR", "USD"];
const th: React.CSSProperties = { textAlign: "left", fontSize: 11.5, textTransform: "uppercase", letterSpacing: ".04em", color: "var(--ink-3)", padding: "10px 8px", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "10px 8px", borderTop: "1px solid var(--line)", fontSize: 13.5, verticalAlign: "top" };
const right: React.CSSProperties = { ...td, textAlign: "right", whiteSpace: "nowrap" };

export function OrderPricingClient({
  orderId, editable, isAdmin, currency: savedCurrency, partnerCurrency, minMargin, pricedAt, rates, items,
}: {
  orderId: string;
  editable: boolean;
  isAdmin: boolean;
  currency: Currency;
  partnerCurrency: Currency;
  minMargin: number;
  pricedAt: string | null;
  rates: Record<string, { rate: number; label: string } | null>;
  items: Item[];
}) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [acceptLow, setAcceptLow] = useState(false);
  const [currency, setCurrency] = useState<Currency>(pricedAt ? savedCurrency : partnerCurrency);
  const [lines, setLines] = useState<Record<string, { type: DiscountType | null; value: string }>>(() =>
    Object.fromEntries(items.map((i) => [i.id,
      i.finalPrice !== null
        ? { type: i.discountType, value: i.discountValue ? String(i.discountValue) : "" }
        : { type: i.suggested && i.suggested.value > 0 ? "PERCENT" : null, value: i.suggested && i.suggested.value > 0 ? String(i.suggested.value) : "" },
    ]))
  );

  // Podgląd: bieżący katalog przeliczony kursem wybranej waluty
  const rate = rates[currency];
  const preview = useMemo(() => items.map((i) => {
    const l = lines[i.id];
    const unitPrice = i.catalogPrice !== null && rate ? round2(i.catalogPrice / rate.rate) : null;
    const costPrice = i.catalogCost !== null && rate ? round2(i.catalogCost / rate.rate) : null;
    const value = l.value === "" ? null : Number(l.value);
    const finalPrice = unitPrice === null ? null : finalUnitPrice(unitPrice, l.type, value);
    return { item: i, input: { quantity: i.quantity, unitPrice, costPrice, discountType: l.type, discountValue: value, finalPrice } };
  }), [items, lines, rate]);

  // Tryb tylko do odczytu (zamówienie zamknięte) — wyłącznie zapisane wartości
  const rows = editable
    ? preview
    : items.map((i) => ({ item: i, input: { quantity: i.quantity, unitPrice: i.unitPrice, costPrice: i.costPrice, discountType: i.discountType, discountValue: i.discountValue, finalPrice: i.finalPrice } }));
  const shownCurrency = editable ? currency : savedCurrency;
  const totals = orderView(rows.map((r) => r.input));
  const lowMargin = rows.filter((r) => { const m = lineView(r.input).margin; return m !== null && m < minMargin; });
  const catalogChanged = editable && pricedAt && currency === savedCurrency &&
    preview.some((p) => p.item.unitPrice !== null && p.input.unitPrice !== null && p.item.unitPrice !== p.input.unitPrice);
  const missingPrice = items.filter((i) => i.catalogPrice === null);

  function save() {
    setMsg(null);
    start(async () => {
      const res = await priceServiceOrder(orderId, {
        currency,
        lines: items.map((i) => ({ itemId: i.id, discountType: lines[i.id].type, discountValue: lines[i.id].value === "" ? null : Number(lines[i.id].value) })),
        acceptLowMargin: acceptLow,
      });
      setMsg(res.success ? { ok: true, text: `Zapisano wycenę: ${res.data?.total}` } : { ok: false, text: res.error });
      if (res.success) router.refresh();
    });
  }

  const set = (id: string, patch: Partial<{ type: DiscountType | null; value: string }>) =>
    setLines((p) => ({ ...p, [id]: { ...p[id], ...patch } }));

  return (
    <SectionCard
      title="Wycena"
      action={
        <span style={{ fontSize: 12.5, color: totals.priced ? "#14633f" : "var(--ink-3)", fontWeight: 600 }}>
          {pricedAt ? `Wyceniono ${new Date(pricedAt).toLocaleDateString("pl-PL")}` : "Niewycenione"}
        </span>
      }
    >
      {editable && (
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Waluta</label>
          <select className="select" style={{ width: 190 }} value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
            {CURRENCIES.map((c) => <option key={c} value={c} disabled={!rates[c]}>{c}{c === partnerCurrency ? " (partnera)" : ""}{!rates[c] ? " — brak kursu" : ""}</option>)}
          </select>
          <span style={{ fontSize: 12.5, color: rate ? "var(--ink-3)" : "#97271b" }}>
            {rate ? rate.label : `Brak kursu ${currency}↔PLN — dodaj go w Admin → Kursy walut.`}
          </span>
        </div>
      )}

      {missingPrice.length > 0 && editable && (
        <div className="nip-note" style={{ marginTop: 0, marginBottom: 12, background: "var(--danger-soft)", color: "#97271b" }}>
          <Icon name="alert" size={18} />Brak ceny sprzedaży w katalogu: {missingPrice.map((i) => i.sku).join(", ")}. Uzupełnij ją w produkcie, aby wycenić.
        </div>
      )}
      {catalogChanged && (
        <div className="nip-note" style={{ marginTop: 0, marginBottom: 12, background: "var(--warn-soft)", color: "#845509" }}>
          <Icon name="info" size={18} />Ceny katalogowe zmieniły się od ostatniej wyceny — zapis przeliczy wycenę według bieżącego cennika.
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Część</th>
              <th style={{ ...th, textAlign: "right" }}>Ilość</th>
              <th style={{ ...th, textAlign: "right" }}>Stan</th>
              <th style={{ ...th, textAlign: "right" }}>Cena kat./szt.</th>
              <th style={th}>Rabat</th>
              <th style={{ ...th, textAlign: "right" }}>Po rabacie/szt.</th>
              <th style={{ ...th, textAlign: "right" }}>Wartość</th>
              <th style={{ ...th, textAlign: "right" }}>Marża</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ item: i, input }) => {
              const v = lineView(input);
              const l = lines[i.id];
              const low = v.margin !== null && v.margin < minMargin;
              return (
                <tr key={i.id}>
                  <td style={{ ...td, minWidth: 190 }}>
                    <div style={{ fontWeight: 600 }}>{i.name}</div>
                    <div className="mono" style={{ fontSize: 12, color: "var(--ink-3)" }}>{i.sku}</div>
                  </td>
                  <td style={right}>{i.quantity}</td>
                  <td style={{ ...right, color: i.stock >= i.quantity ? "#14633f" : "#97271b" }}>{i.stock}</td>
                  <td style={right}>{fmtMoney(input.unitPrice, shownCurrency)}</td>
                  <td style={td}>
                    {editable ? (
                      <div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <select className="select" style={{ width: 92, padding: "6px 8px" }} value={l.type ?? ""}
                            onChange={(e) => set(i.id, { type: (e.target.value || null) as DiscountType | null, value: e.target.value ? l.value : "" })}>
                            <option value="">brak</option>
                            <option value="PERCENT">%</option>
                            <option value="AMOUNT">{currency}/szt.</option>
                          </select>
                          {l.type && (
                            <input className="input" style={{ width: 80, padding: "6px 8px" }} type="number" min={0} step="0.01"
                              value={l.value} onChange={(e) => set(i.id, { value: e.target.value })} />
                          )}
                        </div>
                        {i.suggested && (
                          <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 4 }}>
                            podpowiedź: {i.suggested.value}% · {i.suggested.source}
                          </div>
                        )}
                      </div>
                    ) : input.discountType ? (
                      input.discountType === "PERCENT" ? `${input.discountValue}%` : `${fmtMoney(input.discountValue, shownCurrency)}/szt.`
                    ) : "—"}
                  </td>
                  <td style={right}>{fmtMoney(v.finalUnit ?? input.finalPrice, shownCurrency)}</td>
                  <td style={{ ...right, fontWeight: 600 }}>{v.priced ? fmtMoney(v.total, shownCurrency) : "—"}</td>
                  <td style={{ ...right, color: low ? "#97271b" : "var(--ink-2)", fontWeight: low ? 700 : 400 }}>
                    {fmtPct(v.margin)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap", marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
        <div style={{ fontSize: 12.5, color: "var(--ink-3)", maxWidth: 420 }}>
          Ceny katalogowe w PLN przeliczane kursem z panelu admina. Rabat kwotowy dotyczy 1 szt.
          Minimalna marża partnera: <b>{minMargin}%</b>.
        </div>
        <div style={{ minWidth: 260, fontSize: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span>Wartość katalogowa</span><span>{fmtMoney(totals.gross, shownCurrency)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#845509" }}><span>Rabaty</span><span>−{fmtMoney(totals.discount, shownCurrency)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16, marginTop: 6, color: "var(--brand)" }}>
            <span>Do zapłaty</span><span>{fmtMoney(totals.total, shownCurrency)}</span>
          </div>
          {totals.margin !== null && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--ink-3)" }}><span>Marża zamówienia</span><span>{fmtPct(totals.margin)}</span></div>}
        </div>
      </div>

      {editable && (
        <>
          {lowMargin.length > 0 && (
            <div className="nip-note" style={{ background: "var(--danger-soft)", color: "#97271b" }}>
              <Icon name="alert" size={18} />
              <span>
                Marża poniżej minimum ({minMargin}%): {lowMargin.map((r) => r.item.sku).join(", ")}.{" "}
                {isAdmin ? (
                  <label style={{ display: "inline-flex", gap: 6, alignItems: "center", fontWeight: 700 }}>
                    <input type="checkbox" checked={acceptLow} onChange={(e) => setAcceptLow(e.target.checked)} />Zatwierdzam niską marżę
                  </label>
                ) : "Zmniejsz rabat albo poproś administratora o zatwierdzenie."}
              </span>
            </div>
          )}
          {msg && (
            <div className="nip-note" style={{ background: msg.ok ? "var(--ok-soft)" : "var(--danger-soft)", color: msg.ok ? "#14633f" : "#97271b" }}>
              <Icon name={msg.ok ? "checkCircle" : "alert"} size={18} />{msg.text}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
            <button className="btn btn-primary" onClick={save} disabled={busy || !rate || missingPrice.length > 0 || (lowMargin.length > 0 && !(isAdmin && acceptLow))}>
              {busy ? "Zapisywanie…" : pricedAt ? "Zapisz zmiany wyceny" : "Zapisz wycenę"}
            </button>
          </div>
        </>
      )}
    </SectionCard>
  );
}
