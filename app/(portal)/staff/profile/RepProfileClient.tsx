"use client";

import { useState, useRef } from "react";
import { PageHead, SectionCard, Field, Avatar } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { ChangePasswordCard } from "@/components/portal/ChangePasswordCard";
import type { Rep } from "@prisma/client";

export function RepProfileClient({ rep: initial }: { rep: Rep }) {
  const [rep, setRep] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState({
    phone: initial.phone ?? "",
    calendarUrl: initial.calendarUrl ?? "",
    bio: initial.bio ?? "",
  });
  const [photoUrl, setPhotoUrl] = useState(initial.photoUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  const initials = rep.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadErr("");
    setUploading(true);

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/upload/avatar", { method: "POST", body: fd });
    const data = await res.json();

    setUploading(false);

    if (!res.ok) {
      setUploadErr(data.error ?? "Błąd uploadu");
    } else {
      setPhotoUrl(data.url);
      // Update rep state immediately so photo shows in header card
      setRep((r) => ({ ...r, photoUrl: data.url }));
    }
    // reset input so the same file can be re-selected
    if (fileRef.current) fileRef.current.value = "";
  }

  async function save() {
    setSaving(true);
    const res = await fetch("/api/rep/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, photoUrl }),
    });
    setSaving(false);

    if (res.ok) {
      const updated = await res.json();
      setRep(updated);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  function cancelEdit() {
    setEditing(false);
    setF({ phone: rep.phone ?? "", calendarUrl: rep.calendarUrl ?? "", bio: rep.bio ?? "" });
    setPhotoUrl(rep.photoUrl ?? "");
    setUploadErr("");
  }

  const currentPhoto = rep.photoUrl || photoUrl;

  return (
    <div className="fadeup" style={{ maxWidth: 760 }}>
      <PageHead title="Mój profil" sub="Dane wyświetlane Partnerom i widoczne w portalu." />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {/* Dane podstawowe */}
        <SectionCard title="Dane konta" style={{ gridColumn: "1 / -1" }}>
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
            <div style={{ flex: "none" }}>
              {currentPhoto ? (
                <img
                  src={currentPhoto}
                  alt={rep.name}
                  style={{ width: 72, height: 72, borderRadius: 14, objectFit: "cover", border: "2px solid var(--line)" }}
                />
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
                ? <a href={rep.calendarUrl} target="_blank" rel="noopener" style={{ fontSize: 14, color: "var(--brand)", display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name="arrowRight" size={14} />Umów spotkanie
                  </a>
                : <span style={{ color: "var(--ink-4)", fontSize: 14 }}>Nie podano</span>}
            </div>
          </div>
        </SectionCard>

        {/* Zdjęcie */}
        <SectionCard title="Zdjęcie profilowe">
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ flex: "none" }}>
              {currentPhoto ? (
                <img src={currentPhoto} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", border: "1px solid var(--line)" }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: 10, background: "var(--surface-3)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-4)" }}>
                  <Icon name="user" size={24} />
                </div>
              )}
            </div>
            <div style={{ flex: 1, fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.5 }}>
              {currentPhoto ? "Zdjęcie wgrane." : "Brak zdjęcia."}
              <br />Wyświetlane Partnerom w panelu.
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Edycja */}
      <div className="card" style={{ marginTop: 20, padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: editing ? 20 : 0 }}>
          <h3 style={{ fontSize: 16 }}>Edytuj dane</h3>
          {!editing && (
            <button className="btn btn-soft btn-sm" onClick={() => setEditing(true)}>
              <Icon name="edit" size={15} />Edytuj
            </button>
          )}
        </div>

        {saved && !editing && (
          <div style={{ color: "var(--ok)", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="checkCircle" size={16} />Zapisano pomyślnie.
          </div>
        )}

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

            {/* Upload zdjęcia */}
            <Field label="Zdjęcie profilowe" hint="JPG, PNG lub WebP · max 5 MB">
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                {/* Podgląd */}
                <div style={{ flex: "none" }}>
                  {photoUrl ? (
                    <img src={photoUrl} alt="" style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover", border: "1px solid var(--line)" }} />
                  ) : (
                    <div style={{ width: 52, height: 52, borderRadius: 10, background: "var(--surface-3)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-4)" }}>
                      <Icon name="user" size={22} />
                    </div>
                  )}
                </div>

                {/* Przycisk */}
                <div style={{ flex: 1 }}>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    style={{ position: "relative" }}
                  >
                    {uploading
                      ? <><Icon name="refresh" size={15} style={{ animation: "spin 1s linear infinite" }} />Wgrywanie…</>
                      : <><Icon name="arrowRight" size={15} />{photoUrl ? "Zmień zdjęcie" : "Wgraj zdjęcie"}</>
                    }
                  </button>
                  {photoUrl && !uploading && (
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ marginLeft: 8, color: "var(--danger)" }}
                      onClick={() => setPhotoUrl("")}
                    >
                      <Icon name="x" size={14} />Usuń
                    </button>
                  )}
                  {uploadErr && (
                    <div style={{ marginTop: 6, fontSize: 12.5, color: "var(--danger)", fontWeight: 600 }}>
                      {uploadErr}
                    </div>
                  )}
                </div>
              </div>
            </Field>

            <Field label="Krótki opis (bio)" hint="1–2 zdania – specjalizacja, region, itp.">
              <textarea
                className="textarea"
                style={{ minHeight: 72 }}
                value={f.bio}
                onChange={(e) => set("bio", e.target.value)}
                placeholder="Handlowiec specjalizujący się we wdrożeniach BHP/MRO dla przemysłu."
              />
            </Field>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={cancelEdit}>Anuluj</button>
              <button className="btn btn-primary" onClick={save} disabled={saving || uploading}>
                <Icon name="check" size={15} />{saving ? "Zapisywanie…" : "Zapisz zmiany"}
              </button>
            </div>
          </div>
        )}
      </div>
      <div style={{ marginTop: 20 }}>
        <ChangePasswordCard />
      </div>
    </div>
  );
}
