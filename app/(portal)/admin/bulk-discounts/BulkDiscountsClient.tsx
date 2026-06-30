"use client";

import { useState } from "react";
import { applyBulkDiscount } from "@/lib/actions/bulk-discounts";

interface Partner {
  id: string;
  name: string;
  short: string;
}

interface Product {
  id: string;
  sku: string;
  name: string;
}

interface BulkDiscountsClientProps {
  partners: Partner[];
  products: Product[];
}

export function BulkDiscountsClient({
  partners,
  products,
}: BulkDiscountsClientProps) {
  const [selectedPartnerIds, setSelectedPartnerIds] = useState<string[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [partnerSearch, setPartnerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const filteredPartners = partners.filter(
    (p) =>
      p.name.toLowerCase().includes(partnerSearch.toLowerCase()) ||
      p.short.toLowerCase().includes(partnerSearch.toLowerCase())
  );

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  const togglePartner = (id: string) => {
    setSelectedPartnerIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const handleApplyDiscount = async () => {
    setError("");
    setSuccess("");

    if (selectedPartnerIds.length === 0) {
      setError("Wybierz co najmniej jednego partnera");
      return;
    }

    if (selectedProductIds.length === 0) {
      setError("Wybierz co najmniej jeden produkt");
      return;
    }

    setLoading(true);

    const result = await applyBulkDiscount({
      partnerIds: selectedPartnerIds,
      productIds: selectedProductIds,
      discountPercent,
    });

    if (result.success && "data" in result) {
      setSuccess(
        `✓ Przypisane: ${result.data.created} nowych rabatów, zaktualizowane: ${result.data.updated}`
      );
      setSelectedPartnerIds([]);
      setSelectedProductIds([]);
      setDiscountPercent(5);
      setTimeout(() => setSuccess(""), 4000);
    } else {
      setError(result.error || "Błąd");
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
          {success}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 24,
          marginBottom: 24,
        }}
      >
        {/* Partners Selection */}
        <div style={{ background: "var(--paper)", borderRadius: "var(--r)", border: "1px solid var(--ink-2)" }}>
          <div style={{ padding: "16px", borderBottom: "1px solid var(--ink-2)" }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
              Partnerzy ({selectedPartnerIds.length})
            </h2>
            <input
              type="text"
              placeholder="Szukaj..."
              value={partnerSearch}
              onChange={(e) => setPartnerSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid var(--ink-2)",
                borderRadius: "var(--r-sm)",
                fontSize: 13,
              }}
            />
          </div>
          <div style={{ maxHeight: "500px", overflowY: "auto" }}>
            {filteredPartners.map((partner) => (
              <label
                key={partner.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--ink-2)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedPartnerIds.includes(partner.id)}
                  onChange={() => togglePartner(partner.id)}
                  style={{ marginRight: 12, cursor: "pointer" }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {partner.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
                    {partner.short}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Products Selection */}
        <div
          style={{
            background: "var(--paper)",
            borderRadius: "var(--r)",
            border: "1px solid var(--ink-2)",
          }}
        >
          <div style={{ padding: "16px", borderBottom: "1px solid var(--ink-2)" }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
              Produkty ({selectedProductIds.length})
            </h2>
            <input
              type="text"
              placeholder="Szukaj..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid var(--ink-2)",
                borderRadius: "var(--r-sm)",
                fontSize: 13,
              }}
            />
          </div>
          <div style={{ maxHeight: "500px", overflowY: "auto" }}>
            {filteredProducts.map((product) => (
              <label
                key={product.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--ink-2)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedProductIds.includes(product.id)}
                  onChange={() => toggleProduct(product.id)}
                  style={{ marginRight: 12, cursor: "pointer" }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {product.sku}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
                    {product.name}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Discount Settings */}
        <div
          style={{
            background: "var(--paper)",
            borderRadius: "var(--r)",
            border: "1px solid var(--ink-2)",
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
              Rabat (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(Number(e.target.value))}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid var(--ink-2)",
                borderRadius: "var(--r-sm)",
                fontSize: 13,
              }}
            />
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 8 }}>
              Rabat procentowy dla wybranych produktów
            </div>
          </div>

          <div
            style={{
              background: "var(--surface-2)",
              padding: 16,
              borderRadius: "var(--r-sm)",
              fontSize: 12,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Podsumowanie:</div>
            <div style={{ marginBottom: 4 }}>
              • Partnerzy: <strong>{selectedPartnerIds.length}</strong>
            </div>
            <div style={{ marginBottom: 4 }}>
              • Produkty: <strong>{selectedProductIds.length}</strong>
            </div>
            <div>
              • Razem przypisań: <strong>{selectedPartnerIds.length * selectedProductIds.length}</strong>
            </div>
          </div>

          <button
            onClick={handleApplyDiscount}
            disabled={loading || selectedPartnerIds.length === 0 || selectedProductIds.length === 0}
            style={{
              padding: "10px 16px",
              background:
                selectedPartnerIds.length === 0 || selectedProductIds.length === 0
                  ? "var(--ink-2)"
                  : "var(--brand)",
              color: "white",
              border: "none",
              borderRadius: "var(--r-sm)",
              cursor:
                selectedPartnerIds.length === 0 || selectedProductIds.length === 0
                  ? "not-allowed"
                  : "pointer",
              fontSize: 13,
              fontWeight: 600,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Stosowanie..." : "Zastosuj rabat"}
          </button>
        </div>
      </div>
    </div>
  );
}
