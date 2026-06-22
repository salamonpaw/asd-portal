"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { setPartnerProductDiscount, verifyPartnerDiscount } from "@/lib/actions/partner-discounts";

interface Product {
  id: string;
  name: string;
  sku: string;
  partnerDiscounts: Array<{
    id: string;
    discountPercent: number;
    verifiedAt: Date | null;
  }>;
}

interface PartnerDiscountsClientProps {
  partnerId: string;
  products: Product[];
}

export function PartnerDiscountsClient({
  partnerId,
  products,
}: PartnerDiscountsClientProps) {
  const [discounts, setDiscounts] = useState<Record<string, number>>(
    products.reduce(
      (acc, p) => ({
        ...acc,
        [p.id]: p.partnerDiscounts[0]?.discountPercent || 0,
      }),
      {}
    )
  );

  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState("");

  const handleDiscountChange = (productId: string, value: number) => {
    setDiscounts((prev) => ({
      ...prev,
      [productId]: Math.max(0, Math.min(100, value)), // 0-100%
    }));
  };

  const handleSave = async (productId: string) => {
    setLoading(productId);
    const result = await setPartnerProductDiscount(
      partnerId,
      productId,
      discounts[productId]
    );

    if (result.success) {
      setSuccess("Rabat zapisany!");
      setTimeout(() => setSuccess(""), 2000);
    }
    setLoading(null);
  };

  const handleVerify = async (productId: string) => {
    setLoading(`verify-${productId}`);
    const result = await verifyPartnerDiscount(partnerId, productId);

    if (result.success) {
      setSuccess("Rabat zweryfikowany!");
      setTimeout(() => setSuccess(""), 2000);
    }
    setLoading(null);
  };

  return (
    <div>
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
          ✓ {success}
        </div>
      )}

      <div
        style={{
          background: "var(--paper)",
          border: "1px solid var(--ink-2)",
          borderRadius: "var(--r)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: 16,
            padding: 16,
            background: "var(--surface-2)",
            borderBottom: "1px solid var(--ink-2)",
            fontWeight: 600,
            fontSize: 12,
            color: "var(--ink-3)",
          }}
        >
          <div>Produkt</div>
          <div style={{ textAlign: "center" }}>Rabat %</div>
          <div style={{ textAlign: "center" }}>Status</div>
          <div style={{ textAlign: "right" }}>Akcje</div>
        </div>

        {products.map((product, idx) => {
          const discount = product.partnerDiscounts[0];
          const isVerified = discount?.verifiedAt;
          const currentDiscount = discounts[product.id];

          return (
            <div
              key={product.id}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 150px",
                gap: 16,
                padding: 16,
                borderBottom:
                  idx < products.length - 1 ? "1px solid var(--ink-2)" : "none",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {product.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                  SKU: {product.sku}
                </div>
              </div>

              <div style={{ textAlign: "center" }}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={currentDiscount}
                  onChange={(e) =>
                    handleDiscountChange(product.id, parseFloat(e.target.value))
                  }
                  style={{
                    width: "60px",
                    padding: "6px 8px",
                    border: "1px solid var(--ink-2)",
                    borderRadius: "var(--r-sm)",
                    textAlign: "center",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                />
                <span style={{ marginLeft: 4, color: "var(--ink-3)" }}>%</span>
              </div>

              <div style={{ textAlign: "center" }}>
                {isVerified ? (
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 8px",
                      background: "var(--success-soft)",
                      color: "var(--success)",
                      borderRadius: "var(--r-sm)",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    ✓ Zweryfikowany
                  </span>
                ) : discount ? (
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 8px",
                      background: "var(--warn-soft)",
                      color: "var(--warn)",
                      borderRadius: "var(--r-sm)",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    ⚠ Do weryfikacji
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color: "var(--ink-3)" }}>—</span>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 6,
                  justifyContent: "flex-end",
                }}
              >
                <button
                  onClick={() => handleSave(product.id)}
                  disabled={loading === product.id}
                  style={{
                    padding: "6px 10px",
                    background: "var(--brand)",
                    color: "white",
                    border: "none",
                    borderRadius: "var(--r-sm)",
                    cursor: loading === product.id ? "not-allowed" : "pointer",
                    fontSize: 11,
                    fontWeight: 600,
                    opacity: loading === product.id ? 0.6 : 1,
                  }}
                >
                  Zapisz
                </button>
                {discount && !isVerified && (
                  <button
                    onClick={() => handleVerify(product.id)}
                    disabled={loading === `verify-${product.id}`}
                    style={{
                      padding: "6px 10px",
                      background: "var(--success)",
                      color: "white",
                      border: "none",
                      borderRadius: "var(--r-sm)",
                      cursor:
                        loading === `verify-${product.id}`
                          ? "not-allowed"
                          : "pointer",
                      fontSize: 11,
                      fontWeight: 600,
                      opacity:
                        loading === `verify-${product.id}` ? 0.6 : 1,
                    }}
                  >
                    Zweryfikuj
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
