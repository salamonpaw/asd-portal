"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHead, Field } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import type { Project } from "@prisma/client";

const RANGES = ["1", "2–3", "4–6", "8–10", "10–15", "16+", "Nie wiem / do ustalenia"];
const STAGES = ["Rozpoznanie potrzeb", "Prezentacja / demo", "Oferta", "Negocjacje", "Decyzja klienta"];
const PROCUREMENT = [
  { id: "BIEZACA",   label: "Bieżąca sprzedaż",  icon: "shieldCheck" },
  { id: "ZAPYTANIE", label: "Zapytanie ofertowe", icon: "fileText" },
  { id: "PRZETARG",  label: "Przetarg",           icon: "shieldOff" },
];

export function EditProjectForm({ project, resubmit }: { project: Project; resubmit: boolean }) {
  const router = useRouter();
  const [f, setF] = useState({
    location: project.location ?? "",
    branch: project.branch ?? "",
    machines: project.machines,
    procurement: project.procurement,
    stage: project.stage,
    description: project.description,
    notes: project.notes ?? "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, resubmit }),
    });
    setSaving(false);
    if (res.ok) router.push(`/partner/projects/${project.id}`);
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <PageHead
        title={resubmit ? "Uzupełnij i wyślij ponownie" : "Edytuj dane projektu"}
        sub={project.customerName}
      />

      <div className="formsec">
        <div style={{ marginBottom: 18, padding: "8px 12px", borderRadius: "var(--r-sm)", background: "var(--surface-3)", display: "inline-flex", gap: 8, alignItems: "center", fontSize: 12.5, color: "var(--ink-2)" }}>
          <Icon name="lock" size={14} />NIP <span className="mono" style={{ fontWeight: 600 }}>{project.customerTaxId}</span> jest zablokowany do edycji
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Lokalizacja">
            <input className="input" value={f.location} onChange={(e) => set("location", e.target.value)} />
          </Field>
          <Field label="Oddział">
            <input className="input" value={f.branch} onChange={(e) => set("branch", e.target.value)} />
          </Field>

          <Field label="Liczba automatów">
            <select className="select" value={f.machines} onChange={(e) => set("machines", e.target.value)}>
              {RANGES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Etap rozmów">
            <select className="select" value={f.stage} onChange={(e) => set("stage", e.target.value)}>
              {STAGES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>

          <Field label="Typ postępowania" full>
            <div className="chips">
              {PROCUREMENT.map((pr) => (
                <button key={pr.id} className={`chip box ${f.procurement === pr.id ? "sel" : ""}`} onClick={() => set("procurement", pr.id)}>
                  <Icon name={pr.icon} size={14} style={{ marginRight: 4 }} />{pr.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Opis potrzeby" full>
            <textarea className="textarea" value={f.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <Field label="Uwagi" full>
            <textarea className="textarea" style={{ minHeight: 60 }} value={f.notes} onChange={(e) => set("notes", e.target.value)} />
          </Field>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={() => router.push(`/partner/projects/${project.id}`)}>Anuluj</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            <Icon name={resubmit ? "send" : "check"} size={16} />
            {resubmit ? "Zapisz i wyślij ponownie" : "Zapisz zmiany"}
          </button>
        </div>
      </div>
    </div>
  );
}
