"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageHead, Field } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";

const RANGES = ["1", "2–3", "4–6", "8–10", "10–15", "16+", "Nie wiem / do ustalenia"];
const STAGES = ["Rozpoznanie potrzeb", "Prezentacja / demo", "Oferta", "Negocjacje", "Decyzja klienta"];
const COUNTRIES = ["Polska", "Czechy", "Słowacja", "Niemcy", "Austria", "Litwa", "Kanada"];
const PROCUREMENT = [
  { id: "BIEZACA",   label: "Bieżąca sprzedaż",   desc: "Standardowy proces zakupowy klienta.", icon: "shieldCheck" },
  { id: "ZAPYTANIE", label: "Zapytanie ofertowe",  desc: "Klient zbiera oferty, brak formalnego przetargu.", icon: "fileText" },
  { id: "PRZETARG",  label: "Przetarg",            desc: "Oficjalne postępowanie – bez ochrony partnerskiej.", icon: "shieldOff" },
];
const SUPPORT = [
  "Przygotowanie oferty", "Udział w spotkaniu z klientem", "Wsparcie techniczne",
  "Wsparcie produktowe", "Dobór automatów", "Analiza opłacalności",
  "Materiały marketingowe", "Prezentacja dla klienta", "Indywidualne warunki handlowe",
];

const blank = {
  name: "", taxId: "", country: "Polska", location: "", branch: "",
  machines: "", procurement: "", description: "", stage: "",
  decisionDate: "", interested: null as boolean | null,
  wantsSupport: null as boolean | null, support: [] as string[], notes: "",
};

export function NewProjectForm({ partnerId, partnerShort, repName, repId, ownActiveTaxIds }: {
  partnerId: string; partnerShort: string; repName: string; repId: string; ownActiveTaxIds: string[];
}) {
  const router = useRouter();
  const [f, setF] = useState(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (k: string, v: unknown) => {
    setF((p) => ({ ...p, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const nipClean = f.taxId.replace(/[\s-]/g, "");
  const nipValid = f.country === "Polska" ? /^\d{10}$/.test(nipClean) : nipClean.length >= 5;
  const isOwnDup = nipValid && ownActiveTaxIds.includes(nipClean);

  const dupStatus = useMemo(() => {
    if (!nipValid) return null;
    if (isOwnDup) return "own";
    return "ok";
  }, [nipValid, isOwnDup]);

  const toggleSupport = (s: string) =>
    set("support", f.support.includes(s) ? f.support.filter((x) => x !== s) : [...f.support, s]);

  async function submit() {
    const er: Record<string, string> = {};
    if (!f.name.trim()) er.name = "Podaj nazwę klienta.";
    if (!nipClean) er.taxId = "Podaj NIP / Tax ID.";
    else if (!nipValid) er.taxId = f.country === "Polska" ? "NIP musi mieć 10 cyfr." : "Nieprawidłowy Tax ID.";
    else if (isOwnDup) er.taxId = "Masz już aktywny projekt na tego klienta.";
    if (!f.machines) er.machines = "Wybierz skalę projektu.";
    if (!f.procurement) er.procurement = "Wybierz typ postępowania.";
    if (!f.description.trim()) er.description = "Opisz potrzebę klienta.";
    if (!f.stage) er.stage = "Wybierz etap rozmów.";
    if (f.interested === null) er.interested = "Wskaż odpowiedź.";
    if (f.wantsSupport === null) er.wantsSupport = "Wskaż odpowiedź.";
    setErrors(er);
    if (Object.keys(er).length) return;

    setSubmitting(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, taxId: nipClean }),
    });
    setSubmitting(false);

    if (res.ok) {
      const project = await res.json();
      router.push(`/partner/projects/${project.id}`);
    }
  }

  return (
    <div style={{ maxWidth: 780, margin: "0 auto" }}>
      <PageHead title="Nowe zgłoszenie projektu" sub="Zarejestruj klienta końcowego i zabezpiecz swoją relację." />

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Sekcja 1 – Klient */}
        <div className="formsec">
          <div className="formsec-h">
            <div className="formsec-n">1</div>
            <div>
              <h3 style={{ fontSize: 16.5 }}>Klient końcowy</h3>
              <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 2 }}>Identyfikacja po NIP / Tax ID – po akceptacji nie będzie można jej zmienić.</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Nazwa klienta końcowego" req error={errors.name} full>
              <input className={`input ${errors.name ? "err" : ""}`} placeholder="np. Zakłady Mięsne Kaszub Sp. z o.o." value={f.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Kraj" req>
              <select className="select" value={f.country} onChange={(e) => set("country", e.target.value)}>
                {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="NIP / Tax ID" req error={errors.taxId} hint={f.country === "Polska" ? "10 cyfr" : "Numer VAT / Tax ID"}>
              <input
                className={`input mono ${errors.taxId ? "err" : nipValid && !isOwnDup ? "ok" : ""}`}
                placeholder={f.country === "Polska" ? "1234567890" : "np. DE123456789"}
                value={f.taxId}
                onChange={(e) => set("taxId", e.target.value)}
                onBlur={() => setTouched(true)}
              />
            </Field>
            <Field label="Lokalizacja">
              <input className="input" placeholder="Miasto / adres" value={f.location} onChange={(e) => set("location", e.target.value)} />
            </Field>
            <Field label="Oddział" full>
              <input className="input" placeholder="np. Zakład produkcyjny nr 2" value={f.branch} onChange={(e) => set("branch", e.target.value)} />
            </Field>
          </div>
          {isOwnDup && (
            <div className="nip-note" style={{ background: "var(--danger-soft)", color: "#97271b" }}>
              <Icon name="alert" size={18} />Masz już aktywny projekt na tego klienta. Otwórz istniejący projekt zamiast zgłaszać nowy.
            </div>
          )}
          {nipValid && !isOwnDup && touched && (
            <div className="nip-note" style={{ background: "var(--ok-soft)", color: "#14633f" }}>
              <Icon name="checkCircle" size={18} />Klient nie jest jeszcze zarejestrowany – możesz zgłosić projekt.
            </div>
          )}
        </div>

        {/* Sekcja 2 – Zapotrzebowanie */}
        <div className="formsec">
          <div className="formsec-h">
            <div className="formsec-n">2</div>
            <div><h3 style={{ fontSize: 16.5 }}>Zapotrzebowanie</h3></div>
          </div>
          <Field label="Szacowana liczba automatów" req error={errors.machines}>
            <div className="chips">
              {RANGES.map((r) => (
                <button key={r} className={`chip ${f.machines === r ? "sel" : ""}`} onClick={() => set("machines", r)}>{r}</button>
              ))}
            </div>
          </Field>
        </div>

        {/* Sekcja 3 – Typ postępowania */}
        <div className="formsec">
          <div className="formsec-h">
            <div className="formsec-n">3</div>
            <div>
              <h3 style={{ fontSize: 16.5 }}>Typ postępowania zakupowego</h3>
              <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 2 }}>Decyduje o tym, czy projekt podlega ochronie partnerskiej.</div>
            </div>
          </div>
          <Field req error={errors.procurement}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              {PROCUREMENT.map((pr) => (
                <button
                  key={pr.id}
                  className={`proc-card ${f.procurement === pr.id ? "sel" : ""} ${pr.id === "PRZETARG" ? "warn" : ""}`}
                  onClick={() => set("procurement", pr.id)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Icon name={pr.icon} size={19} />
                    {f.procurement === pr.id && <Icon name="checkCircle" size={18} />}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14.5, marginTop: 12 }}>{pr.label}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4, lineHeight: 1.4 }}>{pr.desc}</div>
                </button>
              ))}
            </div>
          </Field>
          {f.procurement === "PRZETARG" && (
            <div className="nip-note" style={{ background: "var(--warn-soft)", color: "#845509" }}>
              <Icon name="shieldOff" size={18} />Projekty przetargowe mogą zostać zarejestrowane, ale <strong>nie są objęte ochroną partnerską</strong>.
            </div>
          )}
        </div>

        {/* Sekcja 4 – Dane projektu */}
        <div className="formsec">
          <div className="formsec-h">
            <div className="formsec-n">4</div>
            <div><h3 style={{ fontSize: 16.5 }}>Dane projektu</h3></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Opis potrzeby klienta" req error={errors.description} full>
              <textarea className={`textarea ${errors.description ? "err" : ""}`} placeholder="Czego potrzebuje klient, jaki kontekst, decydent…" value={f.description} onChange={(e) => set("description", e.target.value)} />
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
            <Field label="Czy klient wyraził zainteresowanie automatami ASD?" req error={errors.interested}>
              <div className="chips">
                <button className={`chip box ${f.interested === true ? "sel" : ""}`} onClick={() => set("interested", true)}>Tak</button>
                <button className={`chip box ${f.interested === false ? "sel" : ""}`} onClick={() => set("interested", false)}>Nie</button>
              </div>
            </Field>
            <Field label="Czy oczekujesz wsparcia ASD?" req error={errors.wantsSupport}>
              <div className="chips">
                <button className={`chip box ${f.wantsSupport === true ? "sel" : ""}`} onClick={() => set("wantsSupport", true)}>Tak</button>
                <button className={`chip box ${f.wantsSupport === false ? "sel" : ""}`} onClick={() => set("wantsSupport", false)}>Nie</button>
              </div>
            </Field>
          </div>
          {f.wantsSupport && (
            <Field label="Zakres oczekiwanego wsparcia ASD" hint="Opcjonalnie" style={{ marginTop: 16 }}>
              <div className="chips">
                {SUPPORT.map((s) => (
                  <button key={s} className={`chip ${f.support.includes(s) ? "sel" : ""}`} onClick={() => toggleSupport(s)}>
                    {f.support.includes(s) && <Icon name="check" size={13} style={{ marginRight: 2 }} />}{s}
                  </button>
                ))}
              </div>
            </Field>
          )}
          <Field label="Uwagi Partnera" hint="Opcjonalnie" style={{ marginTop: 16 }}>
            <textarea className="textarea" style={{ minHeight: 64 }} placeholder="Dodatkowe informacje dla Handlowca ASD…" value={f.notes} onChange={(e) => set("notes", e.target.value)} />
          </Field>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "4px 2px" }}>
          <div style={{ fontSize: 13, color: "var(--ink-3)", display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="info" size={16} />Zgłoszenie trafi do weryfikacji Handlowca: <strong style={{ color: "var(--ink-2)" }}>{repName}</strong>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-ghost" onClick={() => router.push("/partner/projects")}>Anuluj</button>
            <button className="btn btn-primary btn-lg" onClick={submit} disabled={submitting || isOwnDup}>
              <Icon name="send" size={16} />{submitting ? "Wysyłanie…" : "Wyślij zgłoszenie"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
