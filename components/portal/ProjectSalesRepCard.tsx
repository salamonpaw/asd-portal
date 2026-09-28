"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Field, KV } from "@/components/ui";
import { updateProjectPartnerSettings } from "@/lib/actions/partner-sales";

type RepOpt = { id: string; name: string; email: string; phone: string | null; active: boolean };

/** Partner: przypisanie handlowca do projektu + nadpisanie rytmu przypomnień. */
export function ProjectSalesRepCard({ projectId, reps, initial, defaultDays }: {
  projectId: string;
  reps: RepOpt[];
  initial: { salesRepId: string | null; reminderDaysBefore: string | null; remindersMuted: boolean };
  defaultDays: string;
}) {
  const router = useRouter();
  const [f, setF] = useState({ salesRepId: initial.salesRepId ?? "", days: initial.reminderDaysBefore ?? "", muted: initial.remindersMuted });
  const [busy, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const dirty =
    f.salesRepId !== (initial.salesRepId ?? "") || f.days !== (initial.reminderDaysBefore ?? "") || f.muted !== initial.remindersMuted;

  return (
    <div className="card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".05em" }}>Handlowiec i przypomnienia</div>
      <Field label="Twój handlowiec" hint={reps.length ? undefined : "Dodaj handlowców w zakładce Handlowcy"}>
        <select className="select" value={f.salesRepId} onChange={(e) => setF({ ...f, salesRepId: e.target.value })}>
          <option value="">— nieprzypisany (przypomnienia do Ciebie) —</option>
          {reps.filter((r) => r.active || r.id === f.salesRepId).map((r) => (
            <option key={r.id} value={r.id}>{r.name}{r.active ? "" : " (nieaktywny)"}</option>
          ))}
        </select>
      </Field>
      <Field label="Dni przed terminem" hint={`Puste = domyślnie (${defaultDays})`}>
        <input className="input" value={f.days} placeholder={defaultDays} onChange={(e) => setF({ ...f, days: e.target.value })} />
      </Field>
      <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13.5 }}>
        <input type="checkbox" checked={f.muted} onChange={(e) => setF({ ...f, muted: e.target.checked })} />Wycisz przypomnienia dla tego projektu
      </label>
      {msg && <div style={{ fontSize: 13, fontWeight: 600, color: msg.ok ? "var(--ok)" : "var(--danger)" }}>{msg.text}</div>}
      <button className="btn btn-primary btn-sm" disabled={busy || !dirty} onClick={() => start(async () => {
        const r = await updateProjectPartnerSettings(projectId, { salesRepId: f.salesRepId || null, reminderDaysBefore: f.days || null, remindersMuted: f.muted });
        setMsg(r.success ? { ok: true, text: "Zapisano." } : { ok: false, text: r.error });
        if (r.success) router.refresh();
      })}>
        {busy ? "Zapisywanie…" : "Zapisz"}
      </button>
    </div>
  );
}

/** ASD: podgląd handlowca partnera (bez edycji). */
export function ProjectSalesRepInfo({ rep }: { rep: RepOpt | null }) {
  if (!rep) return null;
  return (
    <div className="card" style={{ padding: 18 }}>
      <KV label="Handlowiec partnera">
        {rep.name}
        <div style={{ fontSize: 12.5, color: "var(--ink-3)", fontWeight: 400 }}>{rep.email}{rep.phone ? ` · ${rep.phone}` : ""}</div>
      </KV>
    </div>
  );
}
