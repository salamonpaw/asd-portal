"use client";

import { useState } from "react";
import { SectionCard, Field } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";

export function ChangePasswordCard() {
  const [f, setF] = useState({ current: "", next: "", confirm: "" });
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");

  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function save() {
    if (f.next !== f.confirm) {
      setStatus("err");
      setMsg("Nowe hasła nie są identyczne.");
      return;
    }
    if (f.next.length < 8) {
      setStatus("err");
      setMsg("Nowe hasło musi mieć minimum 8 znaków.");
      return;
    }
    setStatus("saving");
    setMsg("");

    const res = await fetch("/api/user/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: f.current, newPassword: f.next }),
    });

    const data = await res.json();
    if (res.ok) {
      setStatus("ok");
      setMsg("Hasło zostało zmienione.");
      setF({ current: "", next: "", confirm: "" });
      setTimeout(() => setStatus("idle"), 4000);
    } else {
      setStatus("err");
      setMsg(data.error ?? "Błąd zmiany hasła.");
    }
  }

  return (
    <SectionCard title="Zmiana hasła">
      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 420 }}>
        <Field label="Aktualne hasło">
          <input className="input" type="password" value={f.current} onChange={(e) => set("current", e.target.value)} placeholder="••••••••" />
        </Field>
        <Field label="Nowe hasło" hint="Minimum 8 znaków">
          <input className="input" type="password" value={f.next} onChange={(e) => set("next", e.target.value)} placeholder="••••••••" />
        </Field>
        <Field label="Powtórz nowe hasło">
          <input className="input" type="password" value={f.confirm} onChange={(e) => set("confirm", e.target.value)} placeholder="••••••••"
            onKeyDown={(e) => { if (e.key === "Enter") save(); }} />
        </Field>

        {status === "err" && (
          <div style={{ padding: "9px 13px", borderRadius: "var(--r-sm)", background: "var(--danger-soft)", color: "var(--danger)", fontSize: 13.5, fontWeight: 600 }}>
            {msg}
          </div>
        )}
        {status === "ok" && (
          <div style={{ padding: "9px 13px", borderRadius: "var(--r-sm)", background: "var(--ok-soft)", color: "var(--ok)", fontSize: 13.5, fontWeight: 600, display: "flex", gap: 8, alignItems: "center" }}>
            <Icon name="checkCircle" size={16} />{msg}
          </div>
        )}

        <div>
          <button className="btn btn-primary" onClick={save} disabled={status === "saving" || !f.current || !f.next || !f.confirm}>
            <Icon name="lock" size={15} />
            {status === "saving" ? "Zapisywanie…" : "Zmień hasło"}
          </button>
        </div>
      </div>
    </SectionCard>
  );
}
