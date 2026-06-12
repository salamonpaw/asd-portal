"use client";

import { useState } from "react";
import { updateProductPrice } from "@/lib/actions/products";
import { SectionCard } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";

interface Product {
  id: string;
  name: string;
  basePrice: number | null;
  inStock: number | null;
}

export function ProductsClient({ products }: { products: Product[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [prices, setPrices] = useState<Record<string, number | null>>(
    Object.fromEntries(products.map((p) => [p.id, p.basePrice]))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSavePrice(productId: string) {
    const newPrice = prices[productId];
    if (newPrice === null || newPrice === undefined) {
      setError("Cena jest wymagana");
      return;
    }
    if (newPrice < 0) {
      setError("Cena nie może być ujemna");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await updateProductPrice(productId, newPrice);
    setLoading(false);

    if (result.success) {
      setEditingId(null);
      setSuccess(`Cena produktu zmieniona na ${newPrice.toFixed(2)} zł`);
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(result.error || "Błąd");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {error && (
        <div style={{ padding: 12, background: "#fee", borderRadius: 6, fontSize: 13, color: "#c00" }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: 12, background: "#efe", borderRadius: 6, fontSize: 13, color: "#060" }}>
          {success}
        </div>
      )}

      {products.length === 0 ? (
        <SectionCard title="Produkty">
          <div style={{ fontSize: 14, color: "var(--ink-3)" }}>Brak produktów</div>
        </SectionCard>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                <th style={{ textAlign: "left", padding: "12px 8px", fontSize: 12, fontWeight: 600, textTransform: "uppercase", color: "var(--ink-3)" }}>Nazwa</th>
                <th style={{ textAlign: "right", padding: "12px 8px", fontSize: 12, fontWeight: 600, textTransform: "uppercase", color: "var(--ink-3)" }}>Cena</th>
                <th style={{ textAlign: "right", padding: "12px 8px", fontSize: 12, fontWeight: 600, textTransform: "uppercase", color: "var(--ink-3)" }}>Stan</th>
                <th style={{ textAlign: "center", padding: "12px 8px", fontSize: 12, fontWeight: 600, textTransform: "uppercase", color: "var(--ink-3)" }}>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} style={{ borderBottom: "1px solid var(--line)", background: editingId === product.id ? "rgba(0,0,0,.02)" : "transparent" }}>
                  <td style={{ padding: "12px 8px", fontSize: 14 }}>{product.name}</td>
                  <td style={{ textAlign: "right", padding: "12px 8px", fontSize: 14 }}>
                    {editingId === product.id ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={prices[product.id] ?? ""}
                        onChange={(e) =>
                          setPrices({ ...prices, [product.id]: parseFloat(e.target.value) || null })
                        }
                        style={{
                          width: "80px",
                          padding: "6px 8px",
                          border: "1px solid var(--brand)",
                          borderRadius: 4,
                          fontSize: 14,
                          fontFamily: "monospace",
                        }}
                      />
                    ) : (
                      `${(prices[product.id] ?? 0).toFixed(2)} zł`
                    )}
                  </td>
                  <td style={{ textAlign: "right", padding: "12px 8px", fontSize: 14 }}>{product.inStock ?? 0}</td>
                  <td style={{ textAlign: "center", padding: "12px 8px" }}>
                    {editingId === product.id ? (
                      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                        <button
                          onClick={() => handleSavePrice(product.id)}
                          disabled={loading}
                          style={{
                            padding: "4px 8px",
                            background: "var(--brand)",
                            color: "#fff",
                            border: "none",
                            borderRadius: 4,
                            fontSize: 12,
                            cursor: loading ? "not-allowed" : "pointer",
                            opacity: loading ? 0.6 : 1,
                          }}
                        >
                          <Icon name="check" size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setPrices({ ...prices, [product.id]: product.basePrice });
                          }}
                          style={{
                            padding: "4px 8px",
                            background: "var(--ink-4)",
                            color: "var(--ink-1)",
                            border: "none",
                            borderRadius: 4,
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          <Icon name="x" size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingId(product.id)}
                        style={{
                          padding: "4px 8px",
                          background: "transparent",
                          color: "var(--brand)",
                          border: "1px solid var(--brand)",
                          borderRadius: 4,
                          fontSize: 12,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          marginLeft: "auto",
                          marginRight: "auto",
                        }}
                      >
                        <Icon name="edit" size={14} />
                        Edytuj
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
