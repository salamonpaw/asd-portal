"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageHead, SectionCard, EmptyState, Modal, Field } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { saveSalesRep, deleteSalesRep, sendFormLink, regenerateFormToken } from "@/lib/actions/partner-sales";

type Rep = {
  id: string; name: string; email: string; phone: string | null; active: boolean;
  formToken: string; projects: number; pending: number;
};

const emptyForm = { id: "", name: "", email: "", phone: "", active: true };

export function SalesRepsClient({ reps, baseUrl }: { reps: Rep[]; baseUrl: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState<typeof emptyForm | null>(null);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null);

  const linkFor = (r: Rep) => `${baseUrl}/r/${r.formToken}`;

  function run(fn: () => Promise<{ success: boolean; error?: string }>, okText: string) {
    start(async () => {
      const res = await fn();
      setFlash(res.success ? { ok: true, text: okText } : { ok: false, text: res.error ?? "Błąd" });
      if (res.success) router.refresh();
    });
  }

  function submitForm() {
    if (!form) return;
    setError("");
    start(async () => {
      const res = await saveSalesRep({ id: form.id || undefined, name: form.name, email: form.email, phone: form.phone, active: form.active });
      if (!res.success) return setError(res.error);
      setForm(null);
      setFlash({ ok: true, text: form.id ? "Zapisano zmiany." : "Dodano handlowca. Wyślij mu link do formularza." });
      router.refresh();
    });
  }

  async function copy(r: Rep) {
    await navigator.clipboard.writeText(linkFor(r));
    setFlash({ ok: true, text: `Skopiowano link dla: ${r.name}` });
  }

  return (
    <div className="fadeup">
      <PageHead title="Handlowcy" sub="Twoi handlowcy zgłaszają zapotrzebowania przez osobisty link — Ty zatwierdzasz i przekazujesz do ASD.">
        <button className="btn btn-primary" onClick={() => { setError(""); setForm(emptyForm); }}>
          <Icon name="plus" size={16} />Dodaj handlowca
        </button>
      </PageHead>

      {flash && (
        <div className="nip-note" style={{ marginBottom: 16, background: flash.ok ? "var(--ok-soft)" : "var(--danger-soft)", color: flash.ok ? "#14633f" : "#97271b" }}>
          <Icon name={flash.ok ? "checkCircle" : "alert"} size={18} />{flash.text}
        </div>
      )}

      <SectionCard pad={false}>
        {reps.length === 0 ? (
          <EmptyState icon="users" title="Brak handlowców" sub="Dodaj pierwszego handlowca, aby mógł zgłaszać projekty przez formularz." />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="ptable" style={{ cursor: "default" }}>
              <thead>
                <tr><th>Handlowiec</th><th>Kontakt</th><th>Projekty</th><th>Czeka</th><th style={{ textAlign: "right" }}>Akcje</th></tr>
              </thead>
              <tbody>
                {reps.map((r) => (
                  <tr key={r.id} style={{ opacity: r.active ? 1 : 0.55 }}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.name}</div>
                      {!r.active && <div style={{ fontSize: 12, color: "var(--ink-3)" }}>nieaktywny</div>}
                    </td>
                    <td style={{ fontSize: 13.5 }}>
                      <div>{r.email}</div>
                      <div style={{ color: "var(--ink-3)" }}>{r.phone || "—"}</div>
                    </td>
                    <td>{r.projects}</td>
                    <td>{r.pending > 0 ? <span className="badge st-verify">{r.pending}</span> : "—"}</td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button className="btn btn-soft btn-sm" disabled={pending || !r.active} title="Wyślij link mailem"
                        onClick={() => run(() => sendFormLink(r.id), `Wysłano link do ${r.email}`)}>
                        <Icon name="send" size={14} />Wyślij link
                      </button>{" "}
                      <button className="btn btn-ghost btn-sm" title="Kopiuj link" onClick={() => copy(r)}><Icon name="copy" size={14} /></button>{" "}
                      <button className="btn btn-ghost btn-sm" title="Edytuj" onClick={() => { setError(""); setForm({ id: r.id, name: r.name, email: r.email, phone: r.phone ?? "", active: r.active }); }}>
                        <Icon name="edit" size={14} />
                      </button>{" "}
                      <button className="btn btn-ghost btn-sm" title="Unieważnij link i wygeneruj nowy" disabled={pending}
                        onClick={() => { if (confirm(`Stary link ${r.name} przestanie działać. Kontynuować?`)) run(() => regenerateFormToken(r.id), "Wygenerowano nowy link — wyślij go handlowcowi."); }}>
                        <Icon name="refresh" size={14} />
                      </button>{" "}
                      <button className="btn btn-ghost btn-sm" title="Usuń" disabled={pending} style={{ color: "var(--danger)" }}
                        onClick={() => { if (confirm(`Usunąć ${r.name}? Jego niezatwierdzone zgłoszenia też zostaną usunięte. (Zamiast tego możesz go dezaktywować w edycji.)`)) run(() => deleteSalesRep(r.id), "Usunięto handlowca."); }}>
                        <Icon name="trash" size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <Modal open={!!form} onClose={() => setForm(null)} width={460}>
        {form && (
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
            <h3 style={{ fontSize: 19 }}>{form.id ? "Edytuj handlowca" : "Nowy handlowiec"}</h3>
            <Field label="Imię i nazwisko" req>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
            </Field>
            <Field label="E-mail" req hint="Na ten adres wyślemy link i przypomnienia o terminach">
              <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Telefon">
              <input className="input" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            {form.id && (
              <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                Aktywny (nieaktywny nie może wysyłać zgłoszeń ani dostawać przypomnień)
              </label>
            )}
            {error && <div style={{ color: "var(--danger)", fontSize: 13.5, fontWeight: 600 }}>{error}</div>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
              <button className="btn btn-ghost" onClick={() => setForm(null)}>Anuluj</button>
              <button className="btn btn-primary" onClick={submitForm} disabled={pending}>{pending ? "Zapisywanie…" : "Zapisz"}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
