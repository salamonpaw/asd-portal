"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { saveMailSettings, testMailSettings, deleteMailSettings } from "@/lib/actions/mail-settings";

export type MailSettingsView = {
  enabled: boolean; host: string; port: number; secure: boolean; username: string;
  hasPassword: boolean; fromName: string; fromEmail: string; replyTo: string;
} | null;

const PRESETS = [
  { label: "Microsoft 365", host: "smtp.office365.com", port: 587, secure: false },
  { label: "Gmail / Workspace", host: "smtp.gmail.com", port: 587, secure: false },
  { label: "SSL (465)", host: "", port: 465, secure: true },
];

export function MailSettingsForm({ scope, initial, fallbackLabel }: {
  scope: "global" | "partner";
  initial: MailSettingsView;
  fallbackLabel: string; // co się dzieje bez konfiguracji
}) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [f, setF] = useState({
    enabled: initial?.enabled ?? true,
    host: initial?.host ?? "",
    port: initial?.port ?? 587,
    secure: initial?.secure ?? false,
    username: initial?.username ?? "",
    password: "",
    clearPassword: false,
    fromName: initial?.fromName ?? "",
    fromEmail: initial?.fromEmail ?? "",
    replyTo: initial?.replyTo ?? "",
  });
  const set = (k: keyof typeof f, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  const act = (fn: () => Promise<{ success: boolean; error?: string; message?: string }>) =>
    start(async () => {
      const r = await fn();
      setMsg(r.success ? { ok: true, text: r.message ?? "OK" } : { ok: false, text: r.error ?? "Błąd" });
      if (r.success) { set("password", ""); set("clearPassword", false); router.refresh(); }
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {!initial && <div className="hint" style={{ fontSize: 13.5 }}>Brak konfiguracji — {fallbackLabel}</div>}

      <div className="chips">
        {PRESETS.map((p) => (
          <button key={p.label} type="button" className="chip" onClick={() => setF((x) => ({ ...x, host: p.host || x.host, port: p.port, secure: p.secure }))}>
            {p.label}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        <Field label="Serwer SMTP" req><input className="input" value={f.host} onChange={(e) => set("host", e.target.value)} placeholder="smtp.office365.com" /></Field>
        <Field label="Port" req><input className="input" type="number" value={f.port} onChange={(e) => set("port", Number(e.target.value))} /></Field>
        <Field label="Użytkownik"><input className="input" value={f.username} onChange={(e) => set("username", e.target.value)} autoComplete="off" /></Field>
        <Field label="Hasło" hint={initial?.hasPassword ? "Zapisane — zostaw puste, aby nie zmieniać" : undefined}>
          <input className="input" type="password" value={f.password} onChange={(e) => set("password", e.target.value)} autoComplete="new-password" placeholder={initial?.hasPassword ? "••••••••" : ""} />
        </Field>
        <Field label="Nadawca — adres" req><input className="input" type="email" value={f.fromEmail} onChange={(e) => set("fromEmail", e.target.value)} placeholder="portal@twojafirma.pl" /></Field>
        <Field label="Nadawca — nazwa"><input className="input" value={f.fromName} onChange={(e) => set("fromName", e.target.value)} placeholder="np. ASD Partner Portal" /></Field>
        <Field label="Odpowiedzi do (Reply-To)" hint="Opcjonalnie"><input className="input" type="email" value={f.replyTo} onChange={(e) => set("replyTo", e.target.value)} /></Field>
      </div>

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", fontSize: 14 }}>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="checkbox" checked={f.secure} onChange={(e) => set("secure", e.target.checked)} />SSL/TLS od początku (port 465)
        </label>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="checkbox" checked={f.enabled} onChange={(e) => set("enabled", e.target.checked)} />Włączony
        </label>
        {initial?.hasPassword && (
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" checked={f.clearPassword} onChange={(e) => set("clearPassword", e.target.checked)} />Usuń zapisane hasło
          </label>
        )}
      </div>

      {msg && (
        <div className="nip-note" style={{ marginTop: 0, background: msg.ok ? "var(--ok-soft)" : "var(--danger-soft)", color: msg.ok ? "#14633f" : "#97271b" }}>
          <Icon name={msg.ok ? "checkCircle" : "alert"} size={18} />{msg.text}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
        {initial && (
          <button className="btn btn-ghost" disabled={busy} style={{ color: "var(--danger)" }}
            onClick={() => { if (confirm("Usunąć konfigurację serwera poczty?")) act(() => deleteMailSettings(scope)); }}>
            Usuń konfigurację
          </button>
        )}
        {initial && (
          <button className="btn btn-soft" disabled={busy} onClick={() => act(() => testMailSettings(scope))}>
            <Icon name="send" size={15} />Wyślij test na mój e-mail
          </button>
        )}
        <button className="btn btn-primary" disabled={busy} onClick={() => act(() => saveMailSettings(scope, f))}>
          {busy ? "Zapisywanie…" : "Zapisz"}
        </button>
      </div>
    </div>
  );
}
