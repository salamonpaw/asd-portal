"use client";

import { useState } from "react";
import { updateServiceOrder } from "@/lib/actions/service-orders";

interface OrderTrackingClientProps {
  orderId: string;
  initialTrackingNumber: string | null;
}

export function OrderTrackingClient({ orderId, initialTrackingNumber }: OrderTrackingClientProps) {
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber || "");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSave = async () => {
    if (!trackingNumber.trim()) {
      setError("Numer śledzenia nie może być pusty");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const result = await updateServiceOrder(orderId, {
        trackingNumber: trackingNumber.trim(),
      });

      if (result.success) {
        setSuccess("Numer śledzenia zapisany");
        setIsEditing(false);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(result.error || "Błąd przy zapisywaniu");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setTrackingNumber(initialTrackingNumber || "");
    setIsEditing(false);
    setError("");
  };

  return (
    <div>
      {error && (
        <div
          style={{
            padding: 8,
            background: "var(--danger-soft)",
            color: "var(--danger)",
            borderRadius: "var(--r-sm)",
            fontSize: 12,
            marginBottom: 8,
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: 8,
            background: "var(--success-soft)",
            color: "var(--success)",
            borderRadius: "var(--r-sm)",
            fontSize: 12,
            marginBottom: 8,
          }}
        >
          {success}
        </div>
      )}

      <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 4, fontWeight: 600, display: "flex", justifyContent: "space-between" }}>
        Numer śledzenia
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              fontSize: 11,
              padding: "2px 8px",
              background: "var(--brand-soft)",
              color: "var(--brand)",
              border: "none",
              borderRadius: "var(--r-sm)",
              cursor: "pointer",
            }}
          >
            Edytuj
          </button>
        )}
      </div>

      {isEditing ? (
        <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="np. DHL123456789"
            disabled={saving}
            style={{
              fontSize: 13,
              padding: "8px 12px",
              border: "1px solid var(--ink-2)",
              borderRadius: "var(--r-sm)",
              fontFamily: "monospace",
              width: "100%",
            }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                fontSize: 12,
                padding: "6px 12px",
                background: "var(--brand)",
                color: "white",
                border: "none",
                borderRadius: "var(--r-sm)",
                cursor: saving ? "not-allowed" : "pointer",
                fontWeight: 600,
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? "Zapisuję..." : "Zapisz"}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              style={{
                fontSize: 12,
                padding: "6px 12px",
                background: "var(--surface-2)",
                color: "var(--ink)",
                border: "none",
                borderRadius: "var(--r-sm)",
                cursor: "pointer",
              }}
            >
              Anuluj
            </button>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 14, fontFamily: "monospace" }}>
          {trackingNumber || "—"}
        </div>
      )}
    </div>
  );
}
