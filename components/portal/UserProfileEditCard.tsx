"use client";

import { useState } from "react";
import { updateUserProfile } from "@/lib/actions/user";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui";

export function UserProfileEditCard({
  initialName,
  initialEmail,
}: {
  initialName: string;
  initialEmail: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await updateUserProfile(name, email);
    setLoading(false);

    if (result.success) {
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error);
    }
  }

  if (!isEditing) {
    return (
      <SectionCard title="Moje dane">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".04em", fontWeight: 600, marginBottom: 4 }}>
              Imię i nazwisko
            </div>
            <div style={{ fontSize: 14 }}>{name}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".04em", fontWeight: 600, marginBottom: 4 }}>
              E-mail
            </div>
            <div style={{ fontSize: 14 }}>{email}</div>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            style={{
              alignSelf: "flex-start",
              padding: "8px 14px",
              background: "var(--brand)",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon name="edit" size={14} />
            Edytuj
          </button>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Edytuj dane">
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={{ display: "block", fontSize: 12, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".04em", fontWeight: 600, marginBottom: 6 }}>
            Imię i nazwisko
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid var(--line)",
              borderRadius: 6,
              fontSize: 14,
              fontFamily: "inherit",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".04em", fontWeight: 600, marginBottom: 6 }}>
            E-mail
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid var(--line)",
              borderRadius: 6,
              fontSize: 14,
              fontFamily: "inherit",
            }}
          />
        </div>

        {error && (
          <div style={{ padding: 12, background: "#fee", borderRadius: 6, fontSize: 13, color: "#c00" }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ padding: 12, background: "#efe", borderRadius: 6, fontSize: 13, color: "#060" }}>
            Dane zaktualizowane
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "8px 14px",
              background: "var(--brand)",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Zapisywanie..." : "Zapisz"}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setName(initialName);
              setEmail(initialEmail);
              setError(null);
            }}
            style={{
              padding: "8px 14px",
              background: "var(--ink-4)",
              color: "var(--ink-1)",
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Anuluj
          </button>
        </div>
      </form>
    </SectionCard>
  );
}
