"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { saveReminderSettings } from "@/lib/actions/partner-sales";

type S = {
  expiryEnabled: boolean; decisionEnabled: boolean; needInfoEnabled: boolean; pendingRequestEnabled: boolean;
  daysBefore: string; repeatEveryDays: number;
};

const TYPES: { key: keyof S; label: string; desc: string; to: string }[] = [
  { key: "expiryEnabled", label: "Wygaśnięcie ochrony projektu", desc: "Wg dni przed terminem", to: "handlowiec projektu" },
  { key: "decisionEnabled", label: "Planowany termin decyzji klienta", desc: "Wg dni przed terminem (1. dzień miesiąca)", to: "handlowiec projektu" },
  { key: "needInfoEnabled", label: "ASD prosi o uzupełnienie danych", desc: "Powtarzane co N dni", to: "handlowiec projektu" },
  { key: "pendingRequestEnabled", label: "Zgłoszenia handlowców czekają na Twoją decyzję", desc: "Powtarzane co N dni", to: "Ty (konto partnera)" },
];

export function ReminderSettingsForm({ initial }: { initial: S }) {
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [busy, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {TYPES.map((t) => (
          <label key={t.key} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14 }}>
            <input type="checkbox" style={{ marginTop: 3 }} checked={f[t.key] as boolean} onChange={(e) => setF({ ...f, [t.key]: e.target.checked })} />
            <span>
              <b>{t.label}</b>
              <span style={{ color: "var(--ink-3)" }}> — {t.desc} · do: {t.to}</span>
            </span>
          </label>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
        <Field label="Dni przed terminem" hint="Oddzielone przecinkami, np. 30,14,7,1. Można nadpisać w konkretnym projekcie.">
          <input className="input" value={f.daysBefore} onChange={(e) => setF({ ...f, daysBefore: e.target.value })} />
        </Field>
        <Field label="Powtarzaj co (dni)" hint="Dla przypomnień o uzupełnieniu i niezatwierdzonych zgłoszeniach">
          <input className="input" type="number" min={1} max={60} value={f.repeatEveryDays} onChange={(e) => setF({ ...f, repeatEveryDays: Number(e.target.value) })} />
        </Field>
      </div>

      <div className="hint" style={{ fontSize: 13 }}>
        Gdy projekt nie ma przypisanego handlowca, przypomnienia trafiają na e-mail konta partnera. Wysyłka raz dziennie rano.
      </div>

      {msg && (
        <div className="nip-note" style={{ marginTop: 0, background: msg.ok ? "var(--ok-soft)" : "var(--danger-soft)", color: msg.ok ? "#14633f" : "#97271b" }}>
          <Icon name={msg.ok ? "checkCircle" : "alert"} size={18} />{msg.text}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="btn btn-primary" disabled={busy} onClick={() => start(async () => {
          const r = await saveReminderSettings(f);
          setMsg(r.success ? { ok: true, text: "Zapisano rytm przypomnień." } : { ok: false, text: r.error });
          if (r.success) router.refresh();
        })}>
          {busy ? "Zapisywanie…" : "Zapisz"}
        </button>
      </div>
    </div>
  );
}
