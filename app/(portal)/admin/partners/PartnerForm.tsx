"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHead, Field } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import type { Partner, Rep, Market } from "@prisma/client";

const LEVELS = ["STANDARD", "BRONZE", "SILVER", "GOLD", "STRATEGIC"];
const COUNTRIES = ["Polska", "Czechy", "Słowacja", "Niemcy", "Austria", "Litwa", "Kanada"];
const ALL_MARKETS = ["Polska", "Czechy", "Słowacja", "Niemcy", "Austria", "Litwa", "Kanada"];

type PartnerWithMarkets = Partner & { markets: Market[] };

export function PartnerForm({ partner, reps }: { partner?: PartnerWithMarkets; reps: Rep[] }) {
  const router = useRouter();
  const isEdit = !!partner;

  const [f, setF] = useState({
    name: partner?.name ?? "",
    short: partner?.short ?? "",
    city: partner?.city ?? "",
    country: partner?.country ?? "Polska",
    contact: partner?.contact ?? "",
    email: partner?.email ?? "",
    phone: partner?.phone ?? "",
    since: partner?.since ?? "",
    level: partner?.level ?? "BRONZE",
    discount: String(partner?.discount ?? 5),
    candidate: partner?.candidate ?? false,
    repId: partner?.repId ?? (reps[0]?.id ?? ""),
    markets: partner?.markets.map((m) => m.name) ?? ["Polska"],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  function toggleMarket(m: string) {
    setF((p) => ({
      ...p,
      markets: p.markets.includes(m) ? p.markets.filter((x) => x !== m) : [...p.markets, m],
    }));
  }

  async function save() {
    if (!f.name.trim() || !f.contact.trim() || !f.email.trim() || !f.repId) {
      return setError("Nazwa, osoba kontaktowa, e-mail i handlowiec są wymagane.");
    }
    setSaving(true);
    setError("");

    const res = await fetch(isEdit ? `/api/admin/partners/${partner!.id}` : "/api/admin/partners", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, discount: parseInt(f.discount) || 5 }),
    });

    setSaving(false);
    if (res.ok) {
      router.push("/admin/partners");
      router.refresh();
    } else {
      const d = await res.json();
      setError(d.error ?? "Błąd zapisu.");
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }} className="fadeup">
      <PageHead
        title={isEdit ? `Edytuj: ${partner!.name}` : "Nowy Partner"}
        sub={isEdit ? "Aktualizuj dane firmy partnerskiej." : "Utwórz profil nowej firmy partnerskiej."}
      />

      <div className="card" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Dane firmy */}
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink-2)", marginBottom: 14, paddingBottom: 8, borderBottom: "1px solid var(--line)" }}>Dane firmy</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Pełna nazwa" req>
              <input className="input" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Vendmax Sp. z o.o." />
            </Field>
            <Field label="Skrót (wyświetlany w portalu)" req>
              <input className="input" value={f.short} onChange={(e) => set("short", e.target.value)} placeholder="Vendmax" />
            </Field>
            <Field label="Miasto">
              <input className="input" value={f.city} onChange={(e) => set("city", e.target.value)} placeholder="Warszawa" />
            </Field>
            <Field label="Kraj">
              <select className="select" value={f.country} onChange={(e) => set("country", e.target.value)}>
                {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Partner od (YYYY-MM)">
              <input className="input" value={f.since} onChange={(e) => set("since", e.target.value)} placeholder="2024-01" />
            </Field>
            <Field label="Kandydat">
              <div className="chips">
                <button className={`chip box ${!f.candidate ? "sel" : ""}`} onClick={() => set("candidate", false)}>Aktywny Partner</button>
                <button className={`chip box ${f.candidate ? "sel" : ""}`} onClick={() => set("candidate", true)}>Kandydat</button>
              </div>
            </Field>
          </div>
        </div>

        {/* Kontakt */}
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink-2)", marginBottom: 14, paddingBottom: 8, borderBottom: "1px solid var(--line)" }}>Kontakt</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Osoba kontaktowa" req>
              <input className="input" value={f.contact} onChange={(e) => set("contact", e.target.value)} placeholder="Jan Kowalski" />
            </Field>
            <Field label="E-mail kontaktowy" req>
              <input className="input" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="kontakt@firma.pl" />
            </Field>
            <Field label="Telefon">
              <input className="input" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+48 600 000 000" />
            </Field>
          </div>
        </div>

        {/* Program partnerski */}
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink-2)", marginBottom: 14, paddingBottom: 8, borderBottom: "1px solid var(--line)" }}>Program Partnerski</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Poziom">
              <div className="chips">
                {LEVELS.map((l) => (
                  <button key={l} className={`chip box ${f.level === l ? "sel" : ""}`} onClick={() => set("level", l)}>{l}</button>
                ))}
              </div>
            </Field>
            <Field label="Rabat bazowy (%)" hint="0–100">
              <input className="input" type="number" min={0} max={100} value={f.discount} onChange={(e) => set("discount", e.target.value)} style={{ width: 100 }} />
            </Field>
            <Field label="Handlowiec ASD" req>
              <select className="select" value={f.repId} onChange={(e) => set("repId", e.target.value)}>
                <option value="">— wybierz —</option>
                {reps.map((r) => <option key={r.id} value={r.id}>{r.name} · {r.region}</option>)}
              </select>
            </Field>
            <Field label="Rynki">
              <div className="chips">
                {ALL_MARKETS.map((m) => (
                  <button key={m} className={`chip ${f.markets.includes(m) ? "sel" : ""}`} onClick={() => toggleMarket(m)}>{m}</button>
                ))}
              </div>
            </Field>
          </div>
        </div>

        {error && (
          <div style={{ padding: "10px 14px", borderRadius: "var(--r-sm)", background: "var(--danger-soft)", color: "var(--danger)", fontSize: 14, fontWeight: 600 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Link href="/admin/partners" className="btn btn-ghost">Anuluj</Link>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            <Icon name={isEdit ? "check" : "plus"} size={15} />
            {saving ? "Zapisywanie…" : isEdit ? "Zapisz zmiany" : "Utwórz Partnera"}
          </button>
        </div>
      </div>
    </div>
  );
}
