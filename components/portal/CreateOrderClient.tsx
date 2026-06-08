"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Field } from "@/components/ui";

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

  async function create() {
    if (loading) return;
    setLoading(true);
    setStatus("idle");
    setMsg("");

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
        setTimeout(() => {
          router.push(`/partner/orders/${data.id}`);
        }, 1500);
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
    </div>
  );
}
