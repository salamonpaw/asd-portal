"use client";

import { useState } from "react";
import Link from "next/link";
import { updateProductPricing } from "@/lib/actions/products";
import { SectionCard } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";

interface Product {
  id: string;
  name: string;
  costPrice: number | null;
  sellingPrice: number | null;
  inStock: number | null;
}

interface PriceState {
  costPrice: number | null;
  sellingPrice: number | null;
}

export function ProductsClient({ products }: { products: Product[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "inStock" | "outOfStock">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [prices, setPrices] = useState<Record<string, PriceState>>(
    Object.fromEntries(products.map((p) => [p.id, { costPrice: p.costPrice, sellingPrice: p.sellingPrice }]))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "inStock" && (p.inStock ?? 0) > 0) ||
      (stockFilter === "outOfStock" && (p.inStock ?? 0) === 0);
    return matchesSearch && matchesStock;
  });

  async function handleSavePrice(productId: string) {
    const priceData = prices[productId];
    if (!priceData || priceData.costPrice === null || priceData.sellingPrice === null) {
      setError("Obie ceny są wymagane");
      return;
    }
    if (priceData.costPrice < 0 || priceData.sellingPrice < 0) {
      setError("Ceny nie mogą być ujemne");
      return;
    }
    if (priceData.sellingPrice < priceData.costPrice) {
      setError("Cena sprzedaży musi być wyższa niż cena zakupu");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await updateProductPricing(productId, priceData.costPrice, priceData.sellingPrice);
    setLoading(false);

    if (result.success) {
      setEditingId(null);
      setSuccess(`Ceny produktu zaktualizowane`);
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

      {/* Search & Filter */}
      <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Wyszukaj produkt..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            minWidth: 200,
            padding: "8px 12px",
            border: "1px solid var(--line)",
            borderRadius: 6,
            fontSize: 13,
          }}
        />
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value as any)}
          style={{
            padding: "8px 12px",
            border: "1px solid var(--line)",
            borderRadius: 6,
            fontSize: 13,
          }}
        >
          <option value="all">Wszystkie</option>
          <option value="inStock">Na stanie</option>
          <option value="outOfStock">Brak na stanie</option>
        </select>
      </div>

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
                <th style={{ textAlign: "right", padding: "12px 8px", fontSize: 12, fontWeight: 600, textTransform: "uppercase", color: "var(--ink-3)" }}>Cena zakupu</th>
                <th style={{ textAlign: "right", padding: "12px 8px", fontSize: 12, fontWeight: 600, textTransform: "uppercase", color: "var(--ink-3)" }}>Cena sprzedaży</th>
                <th style={{ textAlign: "right", padding: "12px 8px", fontSize: 12, fontWeight: 600, textTransform: "uppercase", color: "var(--ink-3)" }}>Stan</th>
                <th style={{ textAlign: "center", padding: "12px 8px", fontSize: 12, fontWeight: 600, textTransform: "uppercase", color: "var(--ink-3)" }}>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} style={{ borderBottom: "1px solid var(--line)", background: editingId === product.id ? "rgba(0,0,0,.02)" : "transparent" }}>
                  <td style={{ padding: "12px 8px", fontSize: 14 }}>
                    <Link href={`/warehouse/products/${product.id}`} style={{ color: "var(--brand)", textDecoration: "none", fontWeight: 500 }}>
                      {product.name}
                    </Link>
                  </td>
                  <td style={{ textAlign: "right", padding: "12px 8px", fontSize: 14 }}>
                    {editingId === product.id ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={prices[product.id]?.costPrice ?? ""}
                        onChange={(e) =>
                          setPrices({ ...prices, [product.id]: { ...prices[product.id], costPrice: parseFloat(e.target.value) || null } })
                        }
                        placeholder="Cena zakupu"
                        style={{
                          width: "100px",
                          padding: "6px 8px",
                          border: "1px solid var(--brand)",
                          borderRadius: 4,
                          fontSize: 14,
                          fontFamily: "monospace",
                        }}
                      />
                    ) : (
                      `${(prices[product.id]?.costPrice ?? 0).toFixed(2)} zł`
                    )}
                  </td>
                  <td style={{ textAlign: "right", padding: "12px 8px", fontSize: 14 }}>
                    {editingId === product.id ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={prices[product.id]?.sellingPrice ?? ""}
                        onChange={(e) =>
                          setPrices({ ...prices, [product.id]: { ...prices[product.id], sellingPrice: parseFloat(e.target.value) || null } })
                        }
                        placeholder="Cena sprzedaży"
                        style={{
                          width: "100px",
                          padding: "6px 8px",
                          border: "1px solid var(--brand)",
                          borderRadius: 4,
                          fontSize: 14,
                          fontFamily: "monospace",
                        }}
                      />
                    ) : (
                      `${(prices[product.id]?.sellingPrice ?? 0).toFixed(2)} zł`
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
                            setPrices({ ...prices, [product.id]: { costPrice: product.costPrice, sellingPrice: product.sellingPrice } });
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

      {products.length > 0 && (
        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 8 }}>
          Wyświetlane: {filteredProducts.length} z {products.length} produktów
        </div>
      )}
    </div>
  );
}
