"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { createPartnerUser } from "@/lib/actions/partner-users";

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

interface PartnerUsersClientProps {
  initialUsers: User[];
}

export function PartnerUsersClient({ initialUsers }: PartnerUsersClientProps) {
  const [users, setUsers] = useState(initialUsers);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name.trim()) {
      setError("Imię jest wymagane");
      return;
    }

    if (!formData.email.trim() || !formData.email.includes("@")) {
      setError("Wpisz poprawny adres email");
      return;
    }

    if (formData.password.length < 6) {
      setError("Hasło musi mieć co najmniej 6 znaków");
      return;
    }

    setLoading(true);
    const result = await createPartnerUser(
      formData.name,
      formData.email,
      formData.password
    );

    if (result.success) {
      setSuccess("Serwisant dodany!");
      setFormData({ name: "", email: "", password: "" });
      setShowForm(false);
      // Add to list
      setUsers([
        {
          id: result.data!.id,
          name: result.data!.name,
          email: result.data!.email,
          createdAt: new Date(),
        },
        ...users,
      ]);
      setTimeout(() => setSuccess(""), 3000);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div>
      {error && (
        <div
          style={{
            padding: 12,
            background: "var(--danger-soft)",
            color: "var(--danger)",
            borderRadius: "var(--r-sm)",
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: 12,
            background: "var(--success-soft)",
            color: "var(--success)",
            borderRadius: "var(--r-sm)",
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          ✓ {success}
        </div>
      )}

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: "10px 16px",
            background: "var(--brand)",
            color: "white",
            border: "none",
            borderRadius: "var(--r-sm)",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 24,
          }}
        >
          <Icon name="plus" size={16} />
          Dodaj serwisanta
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{
            background: "var(--paper)",
            border: "1px solid var(--ink-2)",
            borderRadius: "var(--r)",
            padding: 24,
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            Nowy serwisant
          </h2>

          <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                Imię i nazwisko *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Jan Kowalski"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid var(--ink-2)",
                  borderRadius: "var(--r-sm)",
                  fontSize: 14,
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="jan@example.com"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid var(--ink-2)",
                  borderRadius: "var(--r-sm)",
                  fontSize: 14,
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                Hasło (min. 6 znaków) *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid var(--ink-2)",
                  borderRadius: "var(--r-sm)",
                  fontSize: 14,
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "8px 16px",
                background: "var(--brand)",
                color: "white",
                border: "none",
                borderRadius: "var(--r-sm)",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 14,
                fontWeight: 600,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Dodawanie..." : "Dodaj serwisanta"}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setFormData({ name: "", email: "", password: "" });
                setError("");
              }}
              style={{
                padding: "8px 16px",
                background: "var(--ink-2)",
                color: "white",
                border: "none",
                borderRadius: "var(--r-sm)",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Anuluj
            </button>
          </div>
        </form>
      )}

      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
          Serwisanci ({users.length})
        </h2>

        {users.length > 0 ? (
          <div
            style={{
              background: "var(--paper)",
              border: "1px solid var(--ink-2)",
              borderRadius: "var(--r)",
              overflow: "hidden",
            }}
          >
            {users.map((user, idx) => (
              <div
                key={user.id}
                style={{
                  padding: 16,
                  borderBottom:
                    idx < users.length - 1 ? "1px solid var(--ink-2)" : "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                    {user.email}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                  Dodany: {new Date(user.createdAt).toLocaleDateString("pl")}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: 32,
              textAlign: "center",
              background: "var(--surface-2)",
              borderRadius: "var(--r)",
              color: "var(--ink-3)",
            }}
          >
            <p>Brak serwisantów</p>
            <p style={{ fontSize: 12, marginTop: 8 }}>
              Dodaj pierwszego serwisanta aby mógł zamawiać części
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
