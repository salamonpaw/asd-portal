"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHead, Field } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import type { Partner, Rep, User } from "@prisma/client";

export function UserForm({ user, partners, reps }: {
  user?: User;
  partners: Partner[];
  reps: Rep[];
}) {
  const router = useRouter();
  const isEdit = !!user;

  const [f, setF] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    password: "",
    role: user?.role ?? "PARTNER",
    partnerId: user?.partnerId ?? "",
    repId: user?.repId ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function save() {
    if (!f.name.trim() || !f.email.trim()) return setError("Imię i e-mail są wymagane.");
    if (!isEdit && !f.password.trim()) return setError("Hasło jest wymagane przy tworzeniu konta.");
    setSaving(true);
    setError("");

    const body: Record<string, string> = {
      name: f.name.trim(),
      email: f.email.trim(),
      role: f.role,
      ...(f.password ? { password: f.password } : {}),
      ...(f.role === "PARTNER" && f.partnerId ? { partnerId: f.partnerId } : {}),
      ...(f.role === "STAFF" && f.repId ? { repId: f.repId } : {}),
    };

    const res = await fetch(isEdit ? `/api/admin/users/${user!.id}` : "/api/admin/users", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);
    if (res.ok) {
      router.push("/admin/users");
      router.refresh();
    } else {
      const d = await res.json();
      setError(d.error ?? "Błąd zapisu.");
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }} className="fadeup">
      <PageHead
        title={isEdit ? "Edytuj użytkownika" : "Nowy użytkownik"}
        sub={isEdit ? user!.email : "Utwórz konto Partnera, Handlowca lub Admina."}
      />

      <div className="card" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Imię i nazwisko" req>
            <input className="input" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Jan Kowalski" />
          </Field>
          <Field label="E-mail" req>
            <input className="input" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="jan@firma.pl" />
          </Field>
        </div>

        <Field label={isEdit ? "Nowe hasło (zostaw puste aby nie zmieniać)" : "Hasło"} req={!isEdit}
          hint={isEdit ? "Minimum 8 znaków" : undefined}>
          <input className="input" type="password" value={f.password} onChange={(e) => set("password", e.target.value)} placeholder="••••••••" />
        </Field>

        <Field label="Rola" req>
          <div className="chips">
            {(["PARTNER", "STAFF", "ADMIN"] as const).map((r) => (
              <button key={r} className={`chip box ${f.role === r ? "sel" : ""}`} onClick={() => set("role", r)}>
                {r === "PARTNER" ? "Partner" : r === "STAFF" ? "Handlowiec" : "Admin"}
              </button>
            ))}
          </div>
        </Field>

        {f.role === "PARTNER" && (
          <Field label="Przypisz do Partnera" hint="Wybierz firmę partnera">
            <select className="select" value={f.partnerId} onChange={(e) => set("partnerId", e.target.value)}>
              <option value="">— brak powiązania —</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>
        )}

        {f.role === "STAFF" && (
          <Field label="Przypisz do Handlowca (Rep)" hint="Wybierz profil handlowca">
            <select className="select" value={f.repId} onChange={(e) => set("repId", e.target.value)}>
              <option value="">— brak powiązania —</option>
              {reps.map((r) => (
                <option key={r.id} value={r.id}>{r.name} · {r.region}</option>
              ))}
            </select>
          </Field>
        )}

        {error && (
          <div style={{ padding: "10px 14px", borderRadius: "var(--r-sm)", background: "var(--danger-soft)", color: "var(--danger)", fontSize: 14, fontWeight: 600 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
          <Link href="/admin/users" className="btn btn-ghost">Anuluj</Link>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            <Icon name={isEdit ? "check" : "plus"} size={15} />
            {saving ? "Zapisywanie…" : isEdit ? "Zapisz zmiany" : "Utwórz konto"}
          </button>
        </div>
      </div>
    </div>
  );
}
