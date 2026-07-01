"use client";

import { useState } from "react";
import { approveOrder, suspendOrder, rejectOrder } from "@/lib/actions/warehouse-orders";

interface OrderActionsClientProps {
  orderId: string;
  currentStatus: string;
}

export function OrderActionsClient({ orderId, currentStatus }: OrderActionsClientProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    const result = await approveOrder(orderId);
    setLoading(false);

    if (result.success) {
      setSuccess("✓ Zamówienie zatwierdzone");
      setTimeout(() => window.location.reload(), 1500);
    } else {
      setError(result.error || "Błąd");
    }
  };

  const handleSuspend = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    const result = await suspendOrder(orderId);
    setLoading(false);

    if (result.success) {
      setSuccess("✓ Zamówienie zawieszone");
      setTimeout(() => window.location.reload(), 1500);
    } else {
      setError(result.error || "Błąd");
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError("Podaj powód odrzucenia");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    const result = await rejectOrder(orderId, rejectionReason);
    setLoading(false);

    if (result.success) {
      setSuccess("✓ Zamówienie odrzucone");
      setTimeout(() => window.location.reload(), 1500);
    } else {
      setError(result.error || "Błąd");
    }
  };

  return (
    <div style={{ background: "var(--paper)", border: "1px solid var(--ink-2)", borderRadius: "var(--r)", padding: 24 }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Zarządzanie zamówieniem</h3>

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
          {success}
        </div>
      )}

      {showRejectReason ? (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
            Powód odrzucenia *
          </label>
          <select
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid var(--ink-2)",
              borderRadius: "var(--r-sm)",
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            <option value="">-- Wybierz powód --</option>
            <option value="brak_dostepnosci">Brak dostępności</option>
            <option value="bledne_dane">Błędne dane</option>
            <option value="duplikat">Duplikat</option>
            <option value="inne">Inne</option>
          </select>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleReject}
              disabled={loading || !rejectionReason}
              style={{
                padding: "8px 16px",
                background: "var(--danger)",
                color: "white",
                border: "none",
                borderRadius: "var(--r-sm)",
                cursor: loading || !rejectionReason ? "not-allowed" : "pointer",
                fontSize: 12,
                fontWeight: 600,
                opacity: loading || !rejectionReason ? 0.6 : 1,
              }}
            >
              {loading ? "Odrzucam..." : "Potwierdź odrzucenie"}
            </button>
            <button
              onClick={() => {
                setShowRejectReason(false);
                setRejectionReason("");
              }}
              style={{
                padding: "8px 16px",
                background: "var(--ink-2)",
                color: "white",
                border: "none",
                borderRadius: "var(--r-sm)",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Anuluj
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleApprove}
            disabled={loading}
            className="btn btn-brand"
            style={{
              padding: "10px 16px",
              background: "var(--brand)",
              color: "white",
              border: "none",
              borderRadius: "var(--r-sm)",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: 600,
              opacity: loading ? 0.6 : 1,
            }}
          >
            ✓ Zatwierdź
          </button>
          <button
            onClick={handleSuspend}
            disabled={loading}
            style={{
              padding: "10px 16px",
              background: "var(--warn)",
              color: "white",
              border: "none",
              borderRadius: "var(--r-sm)",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: 600,
              opacity: loading ? 0.6 : 1,
            }}
          >
            ⏸ Zawieś
          </button>
          <button
            onClick={() => setShowRejectReason(true)}
            disabled={loading}
            style={{
              padding: "10px 16px",
              background: "var(--danger)",
              color: "white",
              border: "none",
              borderRadius: "var(--r-sm)",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: 600,
              opacity: loading ? 0.6 : 1,
            }}
          >
            ✕ Odrzuć
          </button>
        </div>
      )}
    </div>
  );
}
