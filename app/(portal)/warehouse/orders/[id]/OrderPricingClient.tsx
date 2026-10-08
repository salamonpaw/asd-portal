"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SectionCard, Modal, Field } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { priceServiceOrder } from "@/lib/actions/service-orders";
import { updateProductPricing } from "@/lib/actions/products";
import { finalUnitPrice, lineView, orderView, fmtMoney, fmtPct, round2, type Currency, type DiscountType } from "@/lib/pricing";

type Item = {
  id: string;
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  stock: number;
  catalogPrice: number | null; // PLN, bieżący katalog
  catalogCost: number | null;  // PLN
  unitPrice: number | null;    // zapisana wycena (waluta zamówienia)
  manualPrice: boolean;
  costPrice: number | null;
  discountType: DiscountType | null;
  discountValue: number | null;
  finalPrice: number | null;
  suggested: { value: number; source: string } | null;
};

type Line = { type: DiscountType | null; value: string; manual: string | null }; // manual: null = cena z katalogu

const CURRENCIES: Currency[] = ["PLN", "EUR", "USD"];
const label: React.CSSProperties = { fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--ink-3)", fontWeight: 600, marginBottom: 4 };
const tag = (bg: string, color: string): React.CSSProperties => ({ display: "inline-block", padding: "2px 8px", borderRadius: 999, fontSize: 11.5, fontWeight: 600, background: bg, color });

export function OrderPricingClient({
  orderId, editable, userName, currency: savedCurrency, partnerCurrency, minMargin, pricedAt, rates, items,
}: {
  orderId: string;
  editable: boolean;
  userName: string;
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
  const [confirm, setConfirm] = useState(false);
  const [currency, setCurrency] = useState<Currency>(pricedAt ? savedCurrency : partnerCurrency);
  const [catalogFor, setCatalogFor] = useState<Item | null>(null);
  const [lines, setLines] = useState<Record<string, Line>>(() =>
    Object.fromEntries(items.map((i) => [i.id,
      i.finalPrice !== null
        ? { type: i.discountType, value: i.discountValue ? String(i.discountValue) : "", manual: i.manualPrice && i.unitPrice !== null ? String(i.unitPrice) : null }
        : { type: i.suggested && i.suggested.value > 0 ? "PERCENT" : null, value: i.suggested && i.suggested.value > 0 ? String(i.suggested.value) : "", manual: null },
    ]))
  );
  const set = (id: string, patch: Partial<Line>) => setLines((p) => ({ ...p, [id]: { ...p[id], ...patch } }));

  const rate = rates[currency];
  const rows = useMemo(() => items.map((i) => {
    if (!editable) {
      return { i, manual: i.manualPrice, missing: false, input: { quantity: i.quantity, unitPrice: i.unitPrice, costPrice: i.costPrice, discountType: i.discountType, discountValue: i.discountValue, finalPrice: i.finalPrice } };
    }
    const l = lines[i.id];
    const manualVal = l.manual !== null && l.manual !== "" ? Number(l.manual) : null;
    const unitPrice = l.manual !== null
      ? (manualVal !== null && manualVal > 0 ? round2(manualVal) : null)
      : i.catalogPrice !== null && rate ? round2(i.catalogPrice / rate.rate) : null;
    const costPrice = i.catalogCost !== null && rate ? round2(i.catalogCost / rate.rate) : null;
    const value = l.value === "" ? null : Number(l.value);
    const finalPrice = unitPrice === null ? null : finalUnitPrice(unitPrice, l.type, value);
    return { i, manual: l.manual !== null, missing: l.manual === null && i.catalogPrice === null, input: { quantity: i.quantity, unitPrice, costPrice, discountType: l.type, discountValue: value, finalPrice } };
  }), [items, lines, rate, editable]);

  const cur = editable ? currency : savedCurrency;
  const totals = orderView(rows.map((r) => r.input));
  const low = rows.filter((r) => { const m = lineView(r.input).margin; return m !== null && m < minMargin; });
  const manualRows = rows.filter((r) => r.manual);
  const missing = rows.filter((r) => r.missing || (r.manual && r.input.unitPrice === null));
  const needsConfirm = editable && (low.length > 0 || manualRows.length > 0);

  function save() {
    setMsg(null);
    start(async () => {
      const res = await priceServiceOrder(orderId, {
        currency,
        lines: items.map((i) => {
          const l = lines[i.id];
          return { itemId: i.id, discountType: l.type, discountValue: l.value === "" ? null : Number(l.value), manualUnitPrice: l.manual !== null && l.manual !== "" ? Number(l.manual) : null };
        }),
        confirmResponsibility: confirm,
      });
      setMsg(res.success ? { ok: true, text: `Zapisano wycenę: ${res.data?.total}` } : { ok: false, text: res.error });
      if (res.success) { setConfirm(false); router.refresh(); }
    });
  }

  return (
    <div id="wycena" style={{ scrollMarginTop: 90 }}>
    <SectionCard
      title="Wycena"
      action={<span style={tag(pricedAt ? "var(--ok-soft)" : "var(--surface-3)", pricedAt ? "#14633f" : "var(--ink-3)")}>{pricedAt ? `Wyceniono ${new Date(pricedAt).toLocaleDateString("pl-PL")}` : "Niewycenione"}</span>}
    >
      {editable && (
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Waluta</span>
          <div className="chips">
            {CURRENCIES.map((c) => (
              <button key={c} type="button" className={`chip box ${currency === c ? "sel" : ""}`} disabled={!rates[c]} onClick={() => setCurrency(c)} title={rates[c] ? rates[c]!.label : "Brak kursu w Admin → Kursy walut"}>
                {c}{c === partnerCurrency ? " · partnera" : ""}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 12.5, color: rate ? "var(--ink-3)" : "#97271b" }}>{rate ? (currency === "PLN" ? "Ceny katalogowe w PLN" : rate.label) : `Brak kursu ${currency}↔PLN — dodaj go w Admin → Kursy walut.`}</span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map(({ i, input, manual, missing: noPrice }) => {
          const v = lineView(input);
          const l = lines[i.id];
          const lowM = v.margin !== null && v.margin < minMargin;
          return (
            <div key={i.id} data-sku={i.sku} style={{ border: `1px solid ${noPrice ? "var(--danger)" : "var(--line)"}`, borderRadius: "var(--r)", padding: 14, display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start", background: noPrice ? "var(--danger-soft)" : "var(--paper, #fff)" }}>
              {/* Część */}
              <div style={{ flex: "2 1 200px", minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14.5 }}>{i.name}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 5 }}>
                  <span className="mono" style={{ fontSize: 12, color: "var(--ink-3)" }}>{i.sku}</span>
                  <span style={tag("var(--surface-3)", "var(--ink-2)")}>{i.quantity} szt.</span>
                  <span style={tag(i.stock >= i.quantity ? "var(--ok-soft)" : "var(--warn-soft)", i.stock >= i.quantity ? "#14633f" : "#845509")}>stan {i.stock}</span>
                  {manual && <span style={tag("#ece6fb", "#5b3fb0")}>cena ręczna</span>}
                </div>
              </div>

              {/* Cena */}
              <div style={{ flex: "1 1 150px" }}>
                <div style={label}>Cena / szt.</div>
                {editable && manual ? (
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input className="input" style={{ width: 110, padding: "6px 8px" }} type="number" min={0} step="0.01" autoFocus={!l.manual}
                      value={l.manual ?? ""} onChange={(e) => set(i.id, { manual: e.target.value })} placeholder="0,00" />
                    <span style={{ fontSize: 13 }}>{currency}</span>
                  </div>
                ) : (
                  <div style={{ fontWeight: 600 }}>{noPrice ? <span style={{ color: "#97271b" }}>brak w cenniku</span> : fmtMoney(input.unitPrice, cur)}</div>
                )}
                {editable && (
                  <div style={{ display: "flex", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
                    {manual ? (
                      i.catalogPrice !== null && <button type="button" style={linkBtn} onClick={() => set(i.id, { manual: null })}>↺ z cennika</button>
                    ) : (
                      <button type="button" style={linkBtn} onClick={() => set(i.id, { manual: input.unitPrice !== null ? String(input.unitPrice) : "" })}>✎ cena ręczna</button>
                    )}
                    <button type="button" style={linkBtn} onClick={() => setCatalogFor(i)}>{i.catalogPrice === null ? "+ uzupełnij cennik" : "✎ cennik"}</button>
                  </div>
                )}
              </div>

              {/* Rabat */}
              <div style={{ flex: "1 1 180px" }}>
                <div style={label}>Rabat</div>
                {editable ? (
                  <>
                    <div style={{ display: "flex", gap: 6 }}>
                      <select className="select" style={{ width: 100, padding: "6px 8px" }} value={l.type ?? ""}
                        onChange={(e) => set(i.id, { type: (e.target.value || null) as DiscountType | null, value: e.target.value ? l.value : "" })}>
                        <option value="">brak</option>
                        <option value="PERCENT">%</option>
                        <option value="AMOUNT">{currency}/szt.</option>
                      </select>
                      {l.type && <input className="input" style={{ width: 80, padding: "6px 8px" }} type="number" min={0} step="0.01" value={l.value} onChange={(e) => set(i.id, { value: e.target.value })} />}
                    </div>
                    {i.suggested && <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 5 }}>podpowiedź: {i.suggested.value}% · {i.suggested.source}</div>}
                  </>
                ) : (
                  <div>{input.discountType ? (input.discountType === "PERCENT" ? `${input.discountValue}%` : `${fmtMoney(input.discountValue, cur)}/szt.`) : "—"}</div>
                )}
              </div>

              {/* Wynik */}
              <div style={{ flex: "1 1 120px", textAlign: "right" }}>
                <div style={label}>Wartość</div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{v.priced ? fmtMoney(v.total, cur) : "—"}</div>
                {v.priced && <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{fmtMoney(v.finalUnit, cur)} / szt.</div>}
                <div style={{ fontSize: 12.5, marginTop: 2, color: lowM ? "#97271b" : "var(--ink-3)", fontWeight: lowM ? 700 : 400 }}>
                  marża {v.margin === null ? "—" : fmtPct(v.margin)}{lowM ? ` (min. ${minMargin}%)` : ""}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Podsumowanie */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap", marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
        <div style={{ fontSize: 12.5, color: "var(--ink-3)", maxWidth: 420, lineHeight: 1.5 }}>
          Ceny katalogowe w PLN, przeliczane kursem z panelu admina. Rabat kwotowy dotyczy 1 szt.
          Minimalna marża partnera: <b>{minMargin}%</b>.
        </div>
        <div style={{ minWidth: 260, fontSize: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span>Wartość katalogowa</span><span>{fmtMoney(totals.gross, cur)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#845509" }}><span>Rabaty</span><span>−{fmtMoney(totals.discount, cur)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 17, marginTop: 6, color: "var(--brand)" }}><span>Do zapłaty</span><span>{fmtMoney(totals.total, cur)}</span></div>
          {totals.margin !== null && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--ink-3)" }}><span>Marża zamówienia</span><span>{fmtPct(totals.margin)}</span></div>}
        </div>
      </div>

      {editable && (
        <>
          {missing.length > 0 && (
            <div className="nip-note" style={{ background: "var(--danger-soft)", color: "#97271b" }}>
              <Icon name="alert" size={18} />Brak ceny: {missing.map((r) => r.i.sku).join(", ")} — uzupełnij cennik albo wpisz cenę ręcznie.
            </div>
          )}
          {needsConfirm && (
            <label className="nip-note" style={{ background: "var(--warn-soft)", color: "#845509", cursor: "pointer", alignItems: "flex-start" }}>
              <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} style={{ marginTop: 3 }} />
              <span>
                <b>Zatwierdzam na własną odpowiedzialność</b>
                {manualRows.length > 0 && <> ceny ręczne ({manualRows.map((r) => r.i.sku).join(", ")})</>}
                {manualRows.length > 0 && low.length > 0 && " oraz"}
                {low.length > 0 && <> marżę poniżej minimum {minMargin}% ({low.map((r) => r.i.sku).join(", ")})</>}.
                {" "}Zostanie to zapisane w historii zamówienia jako: {userName}.
              </span>
            </label>
          )}
          {msg && (
            <div className="nip-note" style={{ background: msg.ok ? "var(--ok-soft)" : "var(--danger-soft)", color: msg.ok ? "#14633f" : "#97271b" }}>
              <Icon name={msg.ok ? "checkCircle" : "alert"} size={18} />{msg.text}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 14 }}>
            {!busy && (needsConfirm && !confirm ? (
              <span style={{ fontSize: 13, color: "#845509", fontWeight: 600 }}>↑ Zaznacz potwierdzenie powyżej, aby zapisać</span>
            ) : !pricedAt && rate && missing.length === 0 ? (
              <span style={{ fontSize: 13, color: "var(--ink-3)" }}>Wycena nie jest jeszcze zapisana</span>
            ) : null)}
            <button className="btn btn-primary" onClick={save} disabled={busy || !rate || missing.length > 0 || (needsConfirm && !confirm)}>
              {busy ? "Zapisywanie…" : pricedAt ? "Zapisz zmiany wyceny" : "Zapisz wycenę"}
            </button>
          </div>
        </>
      )}

      <CatalogPriceModal item={catalogFor} onClose={() => setCatalogFor(null)} onSaved={(id) => { set(id, { manual: null }); setCatalogFor(null); router.refresh(); }} />
    </SectionCard>
    </div>
  );
}

const linkBtn: React.CSSProperties = { background: "none", border: "none", padding: 0, color: "var(--brand)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" };

/** Uzupełnienie/zmiana cennika produktu bez wychodzenia z wyceny (ceny w PLN). */
function CatalogPriceModal({ item, onClose, onSaved }: { item: Item | null; onClose: () => void; onSaved: (itemId: string) => void }) {
  const [sell, setSell] = useState("");
  const [cost, setCost] = useState("");
  const [err, setErr] = useState("");
  const [busy, start] = useTransition();
  const [forId, setForId] = useState<string | null>(null);
  if (item && forId !== item.id) {
    setForId(item.id);
    setSell(item.catalogPrice !== null ? String(item.catalogPrice) : "");
    setCost(item.catalogCost !== null ? String(item.catalogCost) : "");
    setErr("");
  }
  return (
    <Modal open={!!item} onClose={onClose} width={440}>
      {item && (
        <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
          <h3 style={{ fontSize: 18 }}>Cennik: {item.name}</h3>
          <div style={{ fontSize: 13, color: "var(--ink-3)" }}>Zmiana dotyczy katalogu (kolejnych wycen). Ceny w PLN netto.</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Cena zakupu (PLN)" req><input className="input" type="number" min={0} step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} autoFocus /></Field>
            <Field label="Cena sprzedaży (PLN)" req><input className="input" type="number" min={0} step="0.01" value={sell} onChange={(e) => setSell(e.target.value)} /></Field>
          </div>
          {sell && cost && Number(sell) > 0 && <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>Marża katalogowa: {fmtPct(round2(((Number(sell) - Number(cost)) / Number(sell)) * 100))}</div>}
          {err && <div style={{ color: "var(--danger)", fontSize: 13.5, fontWeight: 600 }}>{err}</div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={onClose}>Anuluj</button>
            <button className="btn btn-primary" disabled={busy || !sell || !cost} onClick={() => start(async () => {
              const r = await updateProductPricing(item.productId, Number(cost), Number(sell));
              if (!r.success) return setErr(r.error);
              onSaved(item.id);
            })}>{busy ? "Zapisywanie…" : "Zapisz w cenniku"}</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
