"use client";

import { useState } from "react";
import { PageHead, SectionCard, Field, Avatar } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import type { Rep } from "@prisma/client";

export function RepProfileClient({ rep: initial }: { rep: Rep }) {
  const [rep, setRep] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState({
    phone: initial.phone ?? "",
    calendarUrl: initial.calendarUrl ?? "",
    photoUrl: initial.photoUrl ?? "",
    bio: initial.bio ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function save() {
    setSaving(true);
    const res = await fetch("/api/rep/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    if (res.ok) {
      const updated = await res.json();
      setRep(updated);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  const initials = rep.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="fadeup" style={{ maxWidth: 760 }}>
      <PageHead title="Mój profil" sub="Dane wyświetlane Partnerom i widoczne w portalu." />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {/* Dane podstawowe */}
        <SectionCard title="Dane konta" style={{ gridColumn: "1 / -1" }}>
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
            <div style={{ flex: "none" }}>
              {rep.photoUrl ? (
                <img src={rep.photoUrl} alt={rep.name} style={{ width: 72, height: 72, borderRadius: 14, objectFit: "cover", border: "2px solid var(--line)" }} />
              ) : (
                <Avatar initials={initials} size={72} color="var(--accent)" />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 20, fontFamily: "var(--font-display)" }}>{rep.name}</div>
              <div style={{ color: "var(--ink-3)", fontSize: 14, marginTop: 3 }}>{rep.email} · {rep.region}</div>
              {rep.bio && <p style={{ marginTop: 10, fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55 }}>{rep.bio}</p>}
            </div>
          </div>
        </SectionCard>

        {/* Dane kontaktowe */}
        <SectionCard title="Dane kontaktowe dla Partnerów">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div style={{ fontSize: 11.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".04em", fontWeight: 600, marginBottom: 4 }}>Telefon</div>
              {rep.phone
                ? <a href={`tel:${rep.phone}`} style={{ fontSize: 15, fontWeight: 600, color: "var(--brand)" }}>{rep.phone}</a>
                : <span style={{ color: "var(--ink-4)", fontSize: 14 }}>Nie podano</span>}
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".04em", fontWeight: 600, marginBottom: 4 }}>Link do kalendarza</div>
              {rep.calendarUrl
                ? <a href={rep.calendarUrl} target="_blank" rel="noopener" style={{ fontSize: 14, color: "var(--brand)", display: "flex", alignItems: "center", gap: 6 }}><Icon name="arrowRight" size={14} />Umów spotkanie</a>
                : <span style={{ color: "var(--ink-4)", fontSize: 14 }}>Nie podano</span>}
            </div>
          </div>
        </SectionCard>

        {/* Link do zdjęcia */}
        <SectionCard title="Zdjęcie profilowe">
          <div style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55 }}>
            Wklej link URL do zdjęcia (np. z Cloudinary, Gravatar lub firmowego CDN). Zdjęcie jest wyświetlane Partnerom w panelu.
          </div>
          {rep.photoUrl && (
            <div style={{ marginTop: 12 }}>
              <img src={rep.photoUrl} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", border: "1px solid var(--line)" }} />
            </div>
          )}
        </SectionCard>
      </div>

      {/* Edycja */}
      <div className="card" style={{ marginTop: 20, padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: editing ? 20 : 0 }}>
          <h3 style={{ fontSize: 16 }}>Edytuj dane kontaktowe</h3>
          {!editing && (
            <button className="btn btn-soft btn-sm" onClick={() => setEditing(true)}>
              <Icon name="edit" size={15} />Edytuj
            </button>
          )}
        </div>

        {editing && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Telefon" hint="Wyświetlany Partnerom w panelu">
                <input className="input" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+48 500 000 000" />
              </Field>
              <Field label="Link do kalendarza" hint="Np. Calendly, Cal.com, Google Calendar">
                <input className="input" value={f.calendarUrl} onChange={(e) => set("calendarUrl", e.target.value)} placeholder="https://calendly.com/twoj-link" />
              </Field>
            </div>
            <Field label="Link do zdjęcia profilowego" hint="URL do pliku JPG/PNG">
              <input className="input" value={f.photoUrl} onChange={(e) => set("photoUrl", e.target.value)} placeholder="https://cdn.firma.pl/twoje-zdjecie.jpg" />
            </Field>
            <Field label="Krótki opis (bio)" hint="1–2 zdania – specjalizacja, region, itp.">
              <textarea className="textarea" style={{ minHeight: 72 }} value={f.bio} onChange={(e) => set("bio", e.target.value)} placeholder="Handlowiec specjalizujący się w wdrożeniach BHP/MRO dla przemysłu motoryzacyjnego w regionie centralnym." />
            </Field>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => { setEditing(false); setF({ phone: rep.phone ?? "", calendarUrl: rep.calendarUrl ?? "", photoUrl: rep.photoUrl ?? "", bio: rep.bio ?? "" }); }}>Anuluj</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                <Icon name="check" size={15} />{saving ? "Zapisywanie…" : "Zapisz zmiany"}
              </button>
            </div>
          </div>
        )}

        {saved && !editing && (
          <div style={{ color: "var(--ok)", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="checkCircle" size={16} />Zapisano pomyślnie.
          </div>
        )}
      </div>
    </div>
  );
}
