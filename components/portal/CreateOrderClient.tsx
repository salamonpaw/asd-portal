"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Field } from "@/components/ui";

interface CreateOrderResponse {
  id: string;
  code: string;
  projectId: string;
}

export function CreateOrderClient({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");
  const [orderData, setOrderData] = useState<CreateOrderResponse | null>(null);

  async function create() {
    if (loading) return;
    setLoading(true);
    setStatus("idle");
    setMsg("");
    setOrderData(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMsg(`Zamówienie ${data.code} zostało utworzone.`);
        setOrderData(data);

        const formUrl = process.env.NEXT_PUBLIC_ORDER_FORM_URL;
        const params = new URLSearchParams({
          orderId: data.id,
          code: data.code,
          projectId: data.projectId,
        }).toString();

        if (formUrl) {
          const opened = window.open(`${formUrl}?${params}`, "_blank");
          if (!opened) {
            console.warn("Popup blocked, showing manual link");
          }
        }
      } else {
        setStatus("error");
        setMsg(data.error || "Błąd przy tworzeniu zamówienia.");
      }
    } catch (err) {
      setStatus("error");
      setMsg("Błąd sieci. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  }

  function openFormManually() {
    if (!orderData) return;
    const formUrl = process.env.NEXT_PUBLIC_ORDER_FORM_URL;
    const params = new URLSearchParams({
      orderId: orderData.id,
      code: orderData.code,
      projectId: orderData.projectId,
    }).toString();
    if (formUrl) {
      window.open(`${formUrl}?${params}`, "_blank");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ fontSize: 14, color: "#767B86", margin: 0 }}>
        Po kliknięciu "Dalej" system wygeneruje unikalny identyfikator zamówienia (np. ORD-2026-1234).
        Będziesz mógł wtedy dodać szczegóły, takie jak data dostawy, powiązane elementy i tracking numbers.
      </p>

      {status === "error" && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 6,
            background: "#F7E1DD",
            color: "#97271b",
            fontSize: 13.5,
            fontWeight: 600,
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <Icon name="alertCircle" size={16} />
          {msg}
        </div>
      )}

      {status === "success" && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 6,
            background: "#E2F0E9",
            color: "#14633f",
            fontSize: 13.5,
            fontWeight: 600,
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <Icon name="checkCircle" size={16} />
          {msg}
        </div>
      )}

      {status === "success" && orderData && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
          <div style={{ padding: 12, background: "#F4F2EC", borderRadius: 8, border: "1px solid #E3E0D7" }}>
            <p style={{ fontSize: 12, color: "#9AA0AB", marginBottom: 4 }}>Kod zamówienia:</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: "#22356B", margin: 0, fontFamily: "monospace" }}>
              {orderData.code}
            </p>
          </div>

          <button
            className="btn btn-brand"
            onClick={openFormManually}
            style={{ width: "100%" }}
          >
            <Icon name="externalLink" size={16} />
            Otwórz formularz zamówienia
          </button>

          <button
            className="btn btn-soft"
            onClick={() => router.push(`/partner/orders/${orderData.id}`)}
            style={{ width: "100%" }}
          >
            <Icon name="arrowRight" size={16} />
            Przejdź do szczegółów zamówienia
          </button>
        </div>
      )}

      {status !== "success" && (
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <button
            className="btn btn-primary"
            onClick={create}
            disabled={loading}
            style={{ flex: 1 }}
          >
            <Icon name="shoppingCart" size={16} />
            {loading ? "Tworzenie…" : "Utwórz zamówienie"}
          </button>
        </div>
      )}
    </div>
  );
}
