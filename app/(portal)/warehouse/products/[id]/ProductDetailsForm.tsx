"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { updateProduct } from "@/lib/actions/products";

interface ProductDetailsFormProps {
  product: {
    id: string;
    name: string;
    description: string;
    serialNumber: string;
    location: string;
  };
}

export function ProductDetailsForm({ product }: ProductDetailsFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    description: product.description,
    serialNumber: product.serialNumber,
    location: product.location,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await updateProduct(product.id, {
        sku: "",
        name: "",
        description: formData.description,
        serialNumber: formData.serialNumber,
        location: formData.location,
      });

      setLoading(false);
      if (result.success) {
        setSuccess("Zapisano zmiany");
        setIsEditing(false);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(result.error || "Błąd");
      }
    } catch (err) {
      setLoading(false);
      setError("Błąd przy zapisywaniu");
    }
  };

  return (
    <div
      style={{
        background: "var(--paper)",
        border: "1px solid var(--ink-2)",
        borderRadius: "var(--r)",
        padding: 24,
        marginBottom: 32,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3>Informacje o produkcie</h3>
        {isEditing ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleSave}
              disabled={loading}
              style={{
                padding: "8px 16px",
                background: "var(--brand)",
                color: "white",
                border: "none",
                borderRadius: "var(--r-sm)",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 12,
                fontWeight: 600,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Zapisywanie..." : "Zapisz"}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  description: product.description,
                  serialNumber: product.serialNumber,
                  location: product.location,
                });
              }}
              disabled={loading}
              style={{
                padding: "8px 16px",
                background: "var(--ink-2)",
                color: "white",
                border: "none",
                borderRadius: "var(--r-sm)",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              Anuluj
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              padding: "8px 12px",
              background: "var(--brand-soft)",
              color: "var(--brand)",
              border: "1px solid var(--brand)",
              borderRadius: "var(--r-sm)",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon name="edit" size={14} />
            Edytuj
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: 12, background: "var(--danger-soft)", borderRadius: "var(--r-sm)", color: "var(--danger)", marginBottom: 16, fontSize: 12 }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: 12, background: "var(--success-soft)", borderRadius: "var(--r-sm)", color: "var(--success)", marginBottom: 16, fontSize: 12 }}>
          ✓ {success}
        </div>
      )}

      <div style={{ display: "grid", gap: 16 }}>
        {/* Description */}
        <div>
          <label style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 8, display: "block", fontWeight: 600 }}>
            Opis produktu
          </label>
          {isEditing ? (
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{
                width: "100%",
                minHeight: 120,
                padding: "12px",
                border: "1px solid var(--ink-2)",
                borderRadius: "var(--r-sm)",
                fontSize: 13,
                fontFamily: "inherit",
                resize: "vertical",
              }}
              placeholder="Dodaj opis produktu..."
            />
          ) : (
            <div
              style={{
                padding: 12,
                background: "var(--surface-2)",
                borderRadius: "var(--r-sm)",
                fontSize: 13,
                color: formData.description ? "var(--ink-2)" : "var(--ink-3)",
                minHeight: 60,
                whiteSpace: "pre-wrap",
              }}
            >
              {formData.description || "Brak opisu"}
            </div>
          )}
        </div>

        {/* Serial Number */}
        <div>
          <label style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 6, display: "block", fontWeight: 600 }}>
            Numer seryjny
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.serialNumber}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid var(--ink-2)",
                borderRadius: "var(--r-sm)",
                fontSize: 13,
              }}
              placeholder="Np. SN12345678"
            />
          ) : (
            <div
              style={{
                padding: 8,
                background: "var(--surface-2)",
                borderRadius: "var(--r-sm)",
                fontSize: 13,
                fontFamily: "monospace",
                color: formData.serialNumber ? "var(--ink-2)" : "var(--ink-3)",
              }}
            >
              {formData.serialNumber || "—"}
            </div>
          )}
        </div>

        {/* Location */}
        <div>
          <label style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 6, display: "block", fontWeight: 600 }}>
            Lokalizacja w maszynie
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid var(--ink-2)",
                borderRadius: "var(--r-sm)",
                fontSize: 13,
              }}
              placeholder="Np. Lewa strona, dolny panel"
            />
          ) : (
            <div
              style={{
                padding: 8,
                background: "var(--surface-2)",
                borderRadius: "var(--r-sm)",
                fontSize: 13,
                color: formData.location ? "var(--ink-2)" : "var(--ink-3)",
              }}
            >
              {formData.location || "—"}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
