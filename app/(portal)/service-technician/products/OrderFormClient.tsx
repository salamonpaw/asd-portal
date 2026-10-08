"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Modal, Field, EmptyState } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { SafeImg } from "@/components/ui/SafeImg";
import { createServiceOrder } from "@/lib/actions/service-orders";

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  machineType: string;
  location: string | null;
  images: string[];
}
export interface Template {
  id: string;
  name: string;
  items: { productId: string; quantity: number }[];
}

type Cart = Record<string, number>; // productId → ilość
const CART_KEY = "asd_parts_cart_v1";
const MAX = 999;
const clamp = (n: number) => Math.max(0, Math.min(MAX, Math.floor(Number.isFinite(n) ? n : 0)));

function Stepper({ value, onChange, size = "md" }: { value: number; onChange: (n: number) => void; size?: "md" | "sm" }) {
  const h = size === "sm" ? 28 : 32;
  return (
    <div className="stepper" onClick={(e) => e.stopPropagation()}>
      <button type="button" style={{ height: h, width: h }} aria-label="mniej" onClick={() => onChange(value - 1)}>−</button>
      <input type="number" inputMode="numeric" min={0} max={MAX} value={value} aria-label="ilość"
        onChange={(e) => onChange(clamp(parseInt(e.target.value || "0", 10)))} />
      <button type="button" style={{ height: h, width: h }} aria-label="więcej" onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}

function Thumb({ src, size }: { src?: string; size: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 8, background: "var(--surface-2)", flex: "none", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <SafeImg src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} fallback={<Icon name="grid" size={size * 0.4} style={{ color: "var(--ink-4)" }} />} />
    </div>
  );
}

export function OrderFormClient({ products, templates, lastAddress }: { products: Product[]; templates: Template[]; lastAddress: string }) {
  const [cart, setCart] = useState<Cart>({});
  const [q, setQ] = useState("");
  const [type, setType] = useState<string | null>(null);
  const [loc, setLoc] = useState<string | null>(null);
  const [details, setDetails] = useState<Product | null>(null);
  const [img, setImg] = useState(0);
  const [step, setStep] = useState<"cart" | "delivery" | "done">("cart");
  const [address, setAddress] = useState(lastAddress);
  const [neededDate, setNeededDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [created, setCreated] = useState<{ id: string; code: string } | null>(null);
  const [busy, start] = useTransition();
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  // koszyk przeżywa odświeżenie strony (tylko w tej przeglądarce)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CART_KEY) || "{}") as Cart;
      setCart(Object.fromEntries(Object.entries(saved).filter(([id, n]) => byId.has(id) && n > 0)));
    } catch {}
  }, [byId]);
  useEffect(() => { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {} }, [cart]);

  const setQty = (id: string, n: number) => setCart((c) => {
    const next = { ...c };
    const v = clamp(n);
    if (v === 0) delete next[id]; else next[id] = v;
    return next;
  });
  const flash = (t: string) => { setToast(t); setTimeout(() => setToast(""), 2200); };

  const types = [...new Set(products.map((p) => p.machineType))];
  const locs = [...new Set(products.map((p) => p.location).filter(Boolean))] as string[];
  const term = q.trim().toLowerCase();
  const list = products.filter((p) =>
    (!type || p.machineType === type) && (!loc || p.location === loc) &&
    (!term || p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term) || p.description.toLowerCase().includes(term))
  );
  const lines = Object.entries(cart).map(([id, n]) => ({ p: byId.get(id)!, n })).filter((l) => l.p);
  const pieces = lines.reduce((s, l) => s + l.n, 0);

  function applyTemplate(id: string) {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setCart((c) => {
      const next = { ...c };
      for (const it of t.items) if (byId.has(it.productId)) next[it.productId] = clamp((next[it.productId] ?? 0) + it.quantity);
      return next;
    });
    flash(`Dodano zestaw „${t.name}”`);
  }

  function submit() {
    setError("");
    if (address.trim().length < 5) return setError("Podaj pełny adres dostawy.");
    start(async () => {
      const r = await createServiceOrder({
        items: lines.map((l) => ({ productId: l.p.id, quantity: l.n })),
        deliveryAddress: address,
        neededDate: neededDate || undefined,
        notes: notes || undefined,
      });
      if (!r.success) return setError(r.error);
      setCreated(r.data!);
      setCart({});
      setNotes(""); setNeededDate("");
      setStep("done");
    });
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="fadeup">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
        <div>
          <Link href="/service-technician/dashboard" className="backlink">← Moje zamówienia</Link>
          <h1 style={{ fontSize: 27, letterSpacing: "-.02em", marginTop: 8 }}>Zamów części</h1>
          <p style={{ color: "var(--ink-3)", marginTop: 4, fontSize: 14.5 }}>Wybierz części, podaj adres — magazyn wyceni i wyśle. Braki magazyn wyśle osobno, z terminem.</p>
        </div>
      </div>

      <div className="shop-grid">
        {/* ── Katalog ── */}
        <div>
          <div className="shop-search" style={{ marginBottom: 12 }}>
            <Icon name="search" size={18} />
            <input className="input" placeholder="Szukaj części: nazwa, numer, opis…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
          </div>
          {(types.length > 1 || locs.length > 1) && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              {types.length > 1 && (
                <div className="chips">
                  <button type="button" className={`chip ${!type ? "sel" : ""}`} onClick={() => setType(null)}>Wszystkie automaty</button>
                  {types.map((t) => <button key={t} type="button" className={`chip ${type === t ? "sel" : ""}`} onClick={() => setType(t)}>{t}</button>)}
                </div>
              )}
              {locs.length > 1 && (
                <div className="chips">
                  <button type="button" className={`chip ${!loc ? "sel" : ""}`} onClick={() => setLoc(null)}>Wszystkie miejsca</button>
                  {locs.map((l) => <button key={l} type="button" className={`chip ${loc === l ? "sel" : ""}`} onClick={() => setLoc(l)}>{l}</button>)}
                </div>
              )}
            </div>
          )}
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 10 }}>{list.length} {list.length === 1 ? "część" : "części"}</div>

          {list.length === 0 ? (
            <div className="card"><EmptyState icon="search" title="Nic nie znaleziono" sub="Zmień wyszukiwanie albo filtry." /></div>
          ) : (
            <div className="shop-products">
              {list.map((p) => {
                const n = cart[p.id] ?? 0;
                return (
                  <div key={p.id} className={`shop-card ${n ? "in-cart" : ""}`}>
                    <div className="shop-img" onClick={() => { setDetails(p); setImg(0); }}>
                      <SafeImg src={p.images[0]} alt={p.name} fallback={<Icon name="grid" size={36} style={{ color: "var(--ink-4)" }} />} />
                    </div>
                    <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                      <div className="shop-name" onClick={() => { setDetails(p); setImg(0); }}>{p.name}</div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        <span className="mono" style={{ fontSize: 12, color: "var(--ink-3)" }}>{p.sku}</span>
                        {p.location && <span className="badge st-new" style={{ fontSize: 11 }}>{p.location}</span>}
                      </div>
                      <div style={{ marginTop: "auto", paddingTop: 6 }}>
                        {n ? (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Stepper value={n} onChange={(v) => setQty(p.id, v)} />
                            <span className="shop-incart" style={{ fontSize: 12, color: "var(--brand)", fontWeight: 600 }}>w koszyku</span>
                          </div>
                        ) : (
                          <button type="button" className="btn btn-soft btn-sm" style={{ width: "100%" }} onClick={() => { setQty(p.id, 1); flash(`Dodano: ${p.name}`); }}>
                            <Icon name="plus" size={14} />Dodaj
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Koszyk / dostawa ── */}
        <div className="shop-cart" id="cart">
          <div className="card" style={{ padding: 18 }}>
            {step === "done" && created ? (
              <div style={{ textAlign: "center", padding: "10px 4px" }}>
                <div style={{ color: "var(--ok)", display: "flex", justifyContent: "center" }}><Icon name="checkCircle" size={46} /></div>
                <h3 style={{ fontSize: 19, marginTop: 10 }}>Zamówienie wysłane</h3>
                <div className="mono" style={{ fontSize: 18, fontWeight: 700, marginTop: 6 }}>{created.code}</div>
                <p style={{ fontSize: 13.5, color: "var(--ink-3)", marginTop: 8 }}>Magazyn je wyceni i wyśle. Status zobaczysz w „Moje zamówienia”.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
                  <Link className="btn btn-primary" href={`/service-technician/orders/${created.id}`}>Zobacz zamówienie</Link>
                  <button type="button" className="btn btn-ghost" onClick={() => { setStep("cart"); setCreated(null); }}>Nowe zamówienie</button>
                </div>
              </div>
            ) : step === "delivery" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <button type="button" onClick={() => setStep("cart")} style={{ alignSelf: "flex-start", background: "none", border: "none", color: "var(--brand)", fontWeight: 600, cursor: "pointer", padding: 0 }}>← Koszyk ({pieces} szt.)</button>
                <h3 style={{ fontSize: 18 }}>Dostawa</h3>
                <Field label="Adres dostawy" req hint={lastAddress && address === lastAddress ? "Ostatnio używany adres" : undefined}>
                  <textarea className="textarea" style={{ minHeight: 70 }} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="ul. Przykładowa 1, 00-000 Miasto" />
                </Field>
                <Field label="Potrzebne do" hint="Opcjonalnie">
                  <input className="input" type="date" min={today} value={neededDate} onChange={(e) => setNeededDate(e.target.value)} />
                </Field>
                <Field label="Uwagi dla magazynu" hint="Opcjonalnie">
                  <textarea className="textarea" style={{ minHeight: 60 }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="np. dostawa do 14:00, kontakt na miejscu…" />
                </Field>
                <div style={{ fontSize: 13, color: "var(--ink-3)" }}>{lines.length} {lines.length === 1 ? "pozycja" : "pozycje"} · {pieces} szt. · ceny ustala magazyn</div>
                {error && <div className="nip-note" style={{ marginTop: 0, background: "var(--danger-soft)", color: "#97271b" }}><Icon name="alert" size={18} />{error}</div>}
                <button type="button" className="btn btn-primary btn-lg" disabled={busy || !lines.length} onClick={submit}>
                  <Icon name="send" size={16} />{busy ? "Wysyłanie…" : "Wyślij zamówienie"}
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontSize: 18 }}>Koszyk</h3>
                  {pieces > 0 && <span className="badge st-new">{lines.length} poz. · {pieces} szt.</span>}
                </div>
                {templates.length > 0 && (
                  <select className="select" value="" onChange={(e) => applyTemplate(e.target.value)}>
                    <option value="">+ Dodaj zestaw z szablonu…</option>
                    {templates.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.items.length} części)</option>)}
                  </select>
                )}
                {lines.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "26px 8px", color: "var(--ink-3)", fontSize: 14 }}>
                    <Icon name="grid" size={28} style={{ color: "var(--ink-4)" }} />
                    <div style={{ marginTop: 8 }}>Koszyk jest pusty.<br />Dodaj części z katalogu.</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: "48vh", overflowY: "auto", paddingRight: 2 }}>
                    {lines.map(({ p, n }) => (
                      <div key={p.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <Thumb src={p.images[0]} size={44} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                          <div className="mono" style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{p.sku}</div>
                        </div>
                        <Stepper size="sm" value={n} onChange={(v) => setQty(p.id, v)} />
                        <button type="button" aria-label="usuń" onClick={() => setQty(p.id, 0)} style={{ background: "none", border: "none", color: "var(--ink-4)", cursor: "pointer", padding: 4 }}><Icon name="trash" size={15} /></button>
                      </div>
                    ))}
                  </div>
                )}
                {lines.length > 0 && (
                  <>
                    <button type="button" className="btn btn-primary btn-lg" onClick={() => setStep("delivery")}>Dalej — dostawa <Icon name="arrowRight" size={16} /></button>
                    <button type="button" onClick={() => setCart({})} style={{ background: "none", border: "none", color: "var(--ink-3)", fontSize: 12.5, cursor: "pointer" }}>Wyczyść koszyk</button>
                  </>
                )}
              </div>
            )}
          </div>
          {toast && <div className="nip-note" style={{ background: "var(--ok-soft)", color: "#14633f", marginTop: 10 }}><Icon name="checkCircle" size={18} />{toast}</div>}
        </div>
      </div>

      {/* ── Pasek koszyka na telefonie ── */}
      {pieces > 0 && step === "cart" && (
        <button type="button" className="shop-mobilebar btn btn-primary" onClick={() => document.getElementById("cart")?.scrollIntoView({ behavior: "smooth" })}>
          Koszyk · {lines.length} poz. · {pieces} szt. <Icon name="arrowRight" size={16} />
        </button>
      )}

      {/* ── Szczegóły części ── */}
      <Modal open={!!details} onClose={() => setDetails(null)} width={720}>
        {details && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, padding: 22 }}>
            <div>
              <div className="shop-img" style={{ borderRadius: "var(--r)", cursor: "default" }}>
                <SafeImg key={details.images[img] ?? "none"} src={details.images[img]} alt={details.name} fallback={<Icon name="grid" size={48} style={{ color: "var(--ink-4)" }} />} />
              </div>
              {details.images.length > 1 && (
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  {details.images.map((src, i) => (
                    <button key={src} type="button" onClick={() => setImg(i)} style={{ border: `2px solid ${i === img ? "var(--brand)" : "transparent"}`, borderRadius: 8, padding: 0, background: "none", cursor: "pointer" }}>
                      <Thumb src={src} size={52} />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <h3 style={{ fontSize: 20 }}>{details.name}</h3>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <span className="mono" style={{ fontSize: 13, color: "var(--ink-3)" }}>{details.sku}</span>
                <span className="badge st-new">{details.machineType}</span>
                {details.location && <span className="badge st-new">{details.location}</span>}
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink-2)", whiteSpace: "pre-wrap" }}>{details.description || "Brak opisu."}</p>
              <div style={{ marginTop: "auto", display: "flex", gap: 10, alignItems: "center" }}>
                {cart[details.id] ? (
                  <><Stepper value={cart[details.id]} onChange={(v) => setQty(details.id, v)} /><span style={{ fontSize: 13, color: "var(--brand)", fontWeight: 600 }}>w koszyku</span></>
                ) : (
                  <button type="button" className="btn btn-primary" onClick={() => { setQty(details.id, 1); flash(`Dodano: ${details.name}`); }}><Icon name="plus" size={15} />Dodaj do koszyka</button>
                )}
                <button type="button" className="btn btn-ghost" style={{ marginLeft: "auto" }} onClick={() => setDetails(null)}>Zamknij</button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
