"use client";

import { useState } from "react";
import { Field } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { RANGES, STAGES, COUNTRIES, PROCUREMENT, SUPPORT, validTaxId } from "@/lib/constants/project-form";

const blank = {
  name: "", taxId: "", country: "Polska", location: "", branch: "",
  machines: "", procurement: "", description: "", stage: "",
  decisionDate: "", interested: null as boolean | null,
  wantsSupport: null as boolean | null, support: [] as string[], notes: "",
};

const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 };

export function RequestFormClient({ token, repName, partnerName }: { token: string; repName: string; partnerName: string }) {
  const [f, setF] = useState(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [fatal, setFatal] = useState("");

  const set = (k: string, v: unknown) => {
    setF((p) => ({ ...p, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };
  const toggleSupport = (s: string) =>
    set("support", f.support.includes(s) ? f.support.filter((x) => x !== s) : [...f.support, s]);

  async function submit() {
    const er: Record<string, string> = {};
    if (!f.name.trim()) er.name = "Podaj nazwę klienta.";
    if (!validTaxId(f.country, f.taxId)) er.taxId = f.country === "Polska" ? "NIP musi mieć 10 cyfr." : "Nieprawidłowy Tax ID.";
    if (!f.machines) er.machines = "Wybierz skalę projektu.";
    if (!f.procurement) er.procurement = "Wybierz typ postępowania.";
    if (!f.description.trim()) er.description = "Opisz potrzebę klienta.";
    if (!f.stage) er.stage = "Wybierz etap rozmów.";
    if (f.interested === null) er.interested = "Wskaż odpowiedź.";
    if (f.wantsSupport === null) er.wantsSupport = "Wskaż odpowiedź.";
    setErrors(er);
    if (Object.keys(er).length) return;

    setSubmitting(true);
    setFatal("");
    const res = await fetch(`/api/public/requests/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    setSubmitting(false);
    if (res.ok) {
      setDone(true);
      window.scrollTo({ top: 0 });
      return;
    }
    const body = await res.json().catch(() => ({}));
    if (body.errors) setErrors(body.errors);
    setFatal(body.error ?? "Nie udało się wysłać zgłoszenia. Spróbuj ponownie.");
  }

  if (done) {
    return (
      <div className="card" style={{ padding: 32, textAlign: "center" }}>
        <div style={{ color: "var(--ok)", display: "flex", justifyContent: "center" }}><Icon name="checkCircle" size={44} /></div>
        <h1 style={{ fontSize: 22, marginTop: 12 }}>Zgłoszenie wysłane</h1>
        <p style={{ color: "var(--ink-3)", marginTop: 8 }}>
          {partnerName} otrzymał Twoje zgłoszenie. Dostaniesz e-mail, gdy zostanie zatwierdzone i przekazane do ASD Systems.
        </p>
        <button className="btn btn-ghost" style={{ marginTop: 18 }} onClick={() => { setF(blank); setDone(false); }}>
          <Icon name="plus" size={15} />Zgłoś kolejny projekt
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <h1 style={{ fontSize: 25, letterSpacing: "-.02em" }}>Zgłoszenie zapotrzebowania</h1>
        <p style={{ color: "var(--ink-3)", marginTop: 6, fontSize: 14.5 }}>
          {repName} · {partnerName} — zgłoszenie trafi do Twojego opiekuna do zatwierdzenia.
        </p>
      </div>

      <div className="formsec">
        <div className="formsec-h"><div className="formsec-n">1</div><div><h3 style={{ fontSize: 16.5 }}>Klient końcowy</h3></div></div>
        <div style={grid}>
          <Field label="Nazwa klienta końcowego" req error={errors.name} full>
            <input className={`input ${errors.name ? "err" : ""}`} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="np. Zakłady Mięsne Kaszub Sp. z o.o." />
          </Field>
          <Field label="Kraj" req>
            <select className="select" value={f.country} onChange={(e) => set("country", e.target.value)}>
              {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="NIP / Tax ID" req error={errors.taxId} hint={f.country === "Polska" ? "10 cyfr" : "Numer VAT / Tax ID"}>
            <input className={`input mono ${errors.taxId ? "err" : ""}`} inputMode={f.country === "Polska" ? "numeric" : "text"} value={f.taxId} onChange={(e) => set("taxId", e.target.value)} />
          </Field>
          <Field label="Lokalizacja">
            <input className="input" value={f.location} onChange={(e) => set("location", e.target.value)} placeholder="Miasto / adres" />
          </Field>
          <Field label="Oddział">
            <input className="input" value={f.branch} onChange={(e) => set("branch", e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="formsec">
        <div className="formsec-h"><div className="formsec-n">2</div><div><h3 style={{ fontSize: 16.5 }}>Zapotrzebowanie</h3></div></div>
        <Field label="Szacowana liczba automatów" req error={errors.machines}>
          <div className="chips">
            {RANGES.map((r) => <button key={r} type="button" className={`chip ${f.machines === r ? "sel" : ""}`} onClick={() => set("machines", r)}>{r}</button>)}
          </div>
        </Field>
        <Field label="Typ postępowania" req error={errors.procurement} style={{ marginTop: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
            {PROCUREMENT.map((pr) => (
              <button key={pr.id} type="button" className={`proc-card ${f.procurement === pr.id ? "sel" : ""} ${pr.id === "PRZETARG" ? "warn" : ""}`} onClick={() => set("procurement", pr.id)}>
                <div style={{ fontWeight: 600, fontSize: 14.5 }}>{pr.label}</div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4, lineHeight: 1.4 }}>{pr.desc}</div>
              </button>
            ))}
          </div>
        </Field>
      </div>

      <div className="formsec">
        <div className="formsec-h"><div className="formsec-n">3</div><div><h3 style={{ fontSize: 16.5 }}>Dane projektu</h3></div></div>
        <div style={grid}>
          <Field label="Opis potrzeby klienta" req error={errors.description} full>
            <textarea className={`textarea ${errors.description ? "err" : ""}`} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="Czego potrzebuje klient, kontekst, decydent…" />
          </Field>
          <Field label="Etap rozmów" req error={errors.stage}>
            <select className={`select ${errors.stage ? "err" : ""}`} value={f.stage} onChange={(e) => set("stage", e.target.value)}>
              <option value="">— wybierz —</option>
              {STAGES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Planowany termin decyzji" hint="Opcjonalnie">
            <input className="input" type="month" value={f.decisionDate} onChange={(e) => set("decisionDate", e.target.value)} />
          </Field>
          <Field label="Klient zainteresowany automatami ASD?" req error={errors.interested}>
            <div className="chips">
              <button type="button" className={`chip box ${f.interested === true ? "sel" : ""}`} onClick={() => set("interested", true)}>Tak</button>
              <button type="button" className={`chip box ${f.interested === false ? "sel" : ""}`} onClick={() => set("interested", false)}>Nie</button>
            </div>
          </Field>
          <Field label="Potrzebne wsparcie ASD?" req error={errors.wantsSupport}>
            <div className="chips">
              <button type="button" className={`chip box ${f.wantsSupport === true ? "sel" : ""}`} onClick={() => set("wantsSupport", true)}>Tak</button>
              <button type="button" className={`chip box ${f.wantsSupport === false ? "sel" : ""}`} onClick={() => set("wantsSupport", false)}>Nie</button>
            </div>
          </Field>
        </div>
        {f.wantsSupport && (
          <Field label="Zakres wsparcia" hint="Opcjonalnie" style={{ marginTop: 16 }}>
            <div className="chips">
              {SUPPORT.map((s) => (
                <button key={s} type="button" className={`chip ${f.support.includes(s) ? "sel" : ""}`} onClick={() => toggleSupport(s)}>{s}</button>
              ))}
            </div>
          </Field>
        )}
        <Field label="Uwagi dla opiekuna" hint="Opcjonalnie" style={{ marginTop: 16 }}>
          <textarea className="textarea" style={{ minHeight: 64 }} value={f.notes} onChange={(e) => set("notes", e.target.value)} />
        </Field>
      </div>

      {fatal && (
        <div className="nip-note" style={{ background: "var(--danger-soft)", color: "#97271b" }}>
          <Icon name="alert" size={18} />{fatal}
        </div>
      )}

      <button className="btn btn-primary btn-lg" onClick={submit} disabled={submitting} style={{ alignSelf: "flex-end" }}>
        <Icon name="send" size={16} />{submitting ? "Wysyłanie…" : "Wyślij do opiekuna"}
      </button>
    </div>
  );
}
