"use client";

import { useState } from "react";
import { createServiceOrder } from "@/lib/actions/service-orders";
import { Icon } from "@/components/ui/Icon";

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  image: string;
  warehouseStock: number;
}

interface ServiceTechnicianProductsClientProps {
  products: Product[];
  userId: string;
  partnerId: string;
}

export function ServiceTechnicianProductsClient({
  products,
  userId,
  partnerId,
}: ServiceTechnicianProductsClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleQuickOrder = async (productId: string) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await createServiceOrder(
        partnerId,
        userId,
        [{ productId, quantity: 1 }],
        "" // deliveryAddress (empty for now, user fills later)
      );

      if (result.success) {
        setSuccess(`✓ Zamówienie ${result.data?.code} utworzone! Czeka na potwierdzenie.`);
        setTimeout(() => {
          window.location.href = `/service-technician/dashboard`;
        }, 2000);
      } else {
        setError(result.error || "Błąd");
      }
    } catch (e) {
      setError("Błąd przy tworzeniu zamówienia");
    } finally {
      setLoading(false);
    }
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
          {success}
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: 24 }}>
        <input
          type="text"
          placeholder="Szukaj produktu lub SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "400px",
            padding: "8px 12px",
            border: "1px solid var(--ink-2)",
            borderRadius: "var(--r-sm)",
            fontSize: 13,
          }}
        />
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              style={{
                background: "var(--paper)",
                border: "1px solid var(--ink-2)",
                borderRadius: "var(--r)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Image */}
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  style={{
                    width: "100%",
                    height: 160,
                    objectFit: "cover",
                    background: "var(--surface-2)",
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: 160,
                    background: "var(--surface-2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--ink-3)",
                  }}
                >
                  <Icon name="image" size={32} />
                </div>
              )}

              {/* Content */}
              <div style={{ padding: 16, flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 4 }}>SKU: {product.sku}</div>
                <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, lineHeight: 1.4 }}>
                  {product.name}
                </h3>

                {product.description && (
                  <p style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 8, lineHeight: 1.4 }}>
                    {product.description.substring(0, 80)}
                    {product.description.length > 80 ? "..." : ""}
                  </p>
                )}

                {/* Stock indicator */}
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 12,
                    color: product.warehouseStock > 0 ? "var(--success)" : "var(--warn)",
                  }}
                >
                  {product.warehouseStock > 0 ? `✓ Na stanie` : "⚠ Niedostępny"}
                </div>

                {/* Button */}
                <button
                  onClick={() => handleQuickOrder(product.id)}
                  disabled={loading || product.warehouseStock === 0}
                  style={{
                    padding: "8px 12px",
                    background: product.warehouseStock > 0 ? "var(--brand)" : "var(--ink-2)",
                    color: "white",
                    border: "none",
                    borderRadius: "var(--r-sm)",
                    cursor: product.warehouseStock > 0 && !loading ? "pointer" : "not-allowed",
                    fontSize: 12,
                    fontWeight: 600,
                    opacity: loading || product.warehouseStock === 0 ? 0.6 : 1,
                  }}
                >
                  {loading ? "Tworzę..." : product.warehouseStock > 0 ? "Zamów" : "Niedostępny"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center", color: "var(--ink-3)", padding: 32 }}>
          Brak produktów
        </div>
      )}
    </div>
  );
}
