"use client";

import { useState } from "react";
import { changeOrderStatus } from "@/lib/actions/order-status";

interface OrderStatusChangerProps {
  orderId: string;
  currentStatus: string;
}

const STATUS_LABELS: Record<string, string> = {
  NOWE: "Nowe",
  PRZYJĘTE: "Przyjęte",
  CZĘŚCIOWO_ZREALIZOWANE: "Częściowo zrealizowane",
  ZREALIZOWANE: "Zrealizowane",
  ODRZUCONE: "Odrzucone",
  ZAWIESZONE: "Zawieszone",
};

const STATUS_COLORS: Record<string, string> = {
  NOWE: "var(--ink-3)",
  PRZYJĘTE: "var(--brand)",
  CZĘŚCIOWO_ZREALIZOWANE: "var(--info)",
  ZREALIZOWANE: "var(--ok)",
  ODRZUCONE: "var(--danger)",
  ZAWIESZONE: "var(--warn)",
};

export function OrderStatusChanger({ orderId, currentStatus }: OrderStatusChangerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const allStatuses = Object.keys(STATUS_LABELS);
  const otherStatuses = allStatuses.filter((s) => s !== currentStatus);

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    setError("");

    const result = await changeOrderStatus(orderId, newStatus);

    setLoading(false);

    if (result.success) {
      setIsOpen(false);
      window.location.reload();
    } else {
      setError(result.error || "Nie udało się zmienić statusu");
    }
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        style={{
          display: "inline-block",
          fontSize: 13,
          padding: "6px 12px",
          background: STATUS_COLORS[currentStatus] || "var(--ink)",
          color: "white",
          borderRadius: "var(--r-sm)",
          border: "none",
          fontWeight: 500,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {STATUS_LABELS[currentStatus]} ↓
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: 4,
            background: "var(--paper)",
            border: "1px solid var(--ink-2)",
            borderRadius: "var(--r-sm)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 100,
            minWidth: 200,
          }}
        >
          {error && (
            <div
              style={{
                padding: "8px 12px",
                fontSize: 11,
                color: "var(--danger)",
                borderBottom: "1px solid var(--ink-2)",
              }}
            >
              {error}
            </div>
          )}

          {otherStatuses.map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              disabled={loading}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "10px 12px",
                border: "none",
                background: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 12,
                color: STATUS_COLORS[status],
                fontWeight: 500,
                borderBottom: "1px solid var(--ink-2)",
                opacity: loading ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-2)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "none";
              }}
            >
              → {STATUS_LABELS[status]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
