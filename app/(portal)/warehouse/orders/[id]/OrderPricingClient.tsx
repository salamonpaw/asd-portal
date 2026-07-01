"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { updateOrderItemPricing, getExchangeRates, checkPartnerOrderStatus } from "@/lib/actions/warehouse-pricing";
import { createPendingOrderItem, getPendingOrderItems } from "@/lib/actions/partial-orders";

interface Product {
  id: string;
  sku: string;
  name: string;
  costPrice: number | null;
  sellingPrice: number | null;
  inStock: number | null;
  inventory?: { currentStock: number } | null;
}

interface OrderItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number | null;
  currency: string;
  exchangeRate: number;
  discountType: string | null;
  discountValue: number | null;
  finalPrice: number | null;
  costPrice: number | null;
  notes: string | null;
}

interface OrderPricingClientProps {
  orderId: string;
  items: OrderItem[];
  partner: { id: string; name: string; currency: string; minProfitMargin: number };
}

export function OrderPricingClient({ orderId, items, partner }: OrderPricingClientProps) {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [warning12m, setWarning12m] = useState<string | null>(null);

  const [formData, setFormData] = useState<Record<string, any>>({});

  // Realizuj Później state
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [pendingDate, setPendingDate] = useState<string>("");
  const [pendingSuffix, setPendingSuffix] = useState<string>("/A");

  const handleEdit = async (item: OrderItem) => {
    setEditingItemId(item.id);

    // Get saved discount from localStorage (per partner)
    const savedDiscount = localStorage.getItem(`partner_discount_${partner.id}`);
    let discountValue = item.discountValue || 0;
    let discountType = item.discountType || "PERCENT";

    if (savedDiscount) {
      try {
        const saved = JSON.parse(savedDiscount);
        discountValue = saved.value || 0;
        discountType = saved.type || "PERCENT";
      } catch (e) {
        // Ignore parse errors
      }
    }

    setFormData({
      [item.id]: {
        currency: item.currency || partner.currency,
        exchangeRate: item.exchangeRate || 1,
        discountType,
        discountValue,
        notes: item.notes || "",
      },
    });

    // Fetch exchange rates
    const ratesResult = await getExchangeRates(partner.id, partner.currency);
    if (ratesResult.success) {
      setExchangeRates(ratesResult.data);
    }

    // Check if partner hasn't ordered in 12m
    const statusResult = await checkPartnerOrderStatus(partner.id);
    if (statusResult.data?.needsVerification) {
      setWarning12m("Partner nie zamawiał w ciągu 12 miesięcy — zweryfikuj rabat");
    }
  };

  const handleSave = async (item: OrderItem) => {
    setError("");
    setSuccess("");

    const data = formData[item.id];
    if (!data) return;

    const sellingPrice = parseFloat(item.unitPrice?.toString() || item.product.sellingPrice?.toString() || "0");
    let finalPrice = sellingPrice;

    if (data.discountValue && data.discountType) {
      if (data.discountType === "PERCENT") {
        finalPrice = sellingPrice - (sellingPrice * data.discountValue) / 100;
      } else if (data.discountType === "AMOUNT") {
        finalPrice = sellingPrice - data.discountValue;
      }
    }

    const costPrice = parseFloat(item.costPrice?.toString() || item.product.costPrice?.toString() || "0");
    const marginPercent = costPrice > 0 ? ((finalPrice - costPrice) / costPrice) * 100 : 0;
    const minMargin = parseFloat(partner.minProfitMargin?.toString() || "10");

    if (marginPercent < minMargin) {
      setError(`Marża za niska (${marginPercent.toFixed(1)}%). Minimum: ${minMargin}%`);
      return;
    }

    setLoading(true);
    const result = await updateOrderItemPricing(item.id, {
      currency: data.currency,
      exchangeRate: data.exchangeRate,
      discountType: data.discountType,
      discountValue: data.discountValue,
      notes: data.notes,
    });

    setLoading(false);

    if (result.success) {
      // Save discount to localStorage for next time
      localStorage.setItem(
        `partner_discount_${partner.id}`,
        JSON.stringify({
          type: data.discountType,
          value: data.discountValue,
          savedAt: new Date().toISOString(),
        })
      );

      setSuccess("Zapisano!");
      setEditingItemId(null);
      setFormData({});
      setTimeout(() => setSuccess(""), 3000);
      // window.location.reload();  // Usunięty agresywny reload
    } else {
      setError(result.error || "Błąd");
    }
  };

  const handleCreatePending = async (item: OrderItem) => {
    if (!pendingDate) {
      setError("Wybierz datę dostępności");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const result = await createPendingOrderItem(
      item.id,
      new Date(pendingDate),
      pendingSuffix
    );

    setLoading(false);

    if (result.success) {
      setSuccess("✓ Dodano do \"Realizuj Później\"");
      setPendingItemId(null);
      setPendingDate("");
      setPendingSuffix("/A");
      setEditingItemId(null);
      setFormData({});
      setTimeout(() => setSuccess(""), 3000);
      // window.location.reload();  // Usunięty agresywny reload
    } else {
      setError(result.error || "Błąd");
    }
  };

  return (
    <div>
      {warning12m && (
        <div
          style={{
            padding: 12,
            background: "var(--warn-soft)",
            color: "var(--warn)",
            borderRadius: "var(--r-sm)",
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          ⚠️ {warning12m}
        </div>
      )}

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
          ✓ {success}
        </div>
      )}

      {/* Modal "Realizuj Później" */}
      {pendingItemId && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setPendingItemId(null)}
        >
          <div
            style={{
              background: "var(--paper)",
              border: "1px solid var(--ink-2)",
              borderRadius: "var(--r)",
              padding: 24,
              maxWidth: 400,
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>Realizuj Później</h3>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                Przewidywana dostępność *
              </label>
              <input
                type="date"
                value={pendingDate}
                onChange={(e) => setPendingDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid var(--ink-2)",
                  borderRadius: "var(--r-sm)",
                  fontSize: 13,
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                Sufiks zamówienia
              </label>
              <select
                value={pendingSuffix}
                onChange={(e) => setPendingSuffix(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid var(--ink-2)",
                  borderRadius: "var(--r-sm)",
                  fontSize: 13,
                }}
              >
                <option value="/A">/A (Część 1)</option>
                <option value="/B">/B (Część 2)</option>
                <option value="/C">/C (Część 3)</option>
                <option value="/D">/D (Część 4)</option>
                <option value="/E">/E (Część 5)</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => handleCreatePending(items.find((i) => i.id === pendingItemId)!)}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  background: "var(--warn)",
                  color: "white",
                  border: "none",
                  borderRadius: "var(--r-sm)",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? "Zapisuję..." : "Dodaj"}
              </button>
              <button
                onClick={() => setPendingItemId(null)}
                style={{
                  flex: 1,
                  padding: "8px 12px",
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
        </div>
      )}

      <div style={{ background: "var(--paper)", border: "1px solid var(--ink-2)", borderRadius: "var(--r)", overflow: "hidden" }}>
        {items.map((item, idx) => {
          const isEditing = editingItemId === item.id;
          const data = formData[item.id];
          const sellingPrice = parseFloat(item.unitPrice?.toString() || item.product.sellingPrice?.toString() || "0");

          let finalPrice = sellingPrice;
          if (isEditing && data?.discountValue && data?.discountType) {
            if (data.discountType === "PERCENT") {
              finalPrice = sellingPrice - (sellingPrice * data.discountValue) / 100;
            } else if (data.discountType === "AMOUNT") {
              finalPrice = sellingPrice - data.discountValue;
            }
          }

          const costPrice = parseFloat(item.costPrice?.toString() || item.product.costPrice?.toString() || "0");
          const marginPercent = costPrice > 0 ? ((finalPrice - costPrice) / costPrice) * 100 : 0;
          const minMargin = parseFloat(partner.minProfitMargin?.toString() || "10");
          const isLowMargin = marginPercent < minMargin;

          return (
            <div
              key={item.id}
              style={{
                padding: 16,
                borderBottom: idx < items.length - 1 ? "1px solid var(--ink-2)" : "none",
                background: isLowMargin && isEditing ? "rgba(255, 0, 0, 0.02)" : "transparent",
              }}
            >
              {!isEditing ? (
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr auto", gap: 16, alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.product.name}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)" }}>SKU: {item.product.sku}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 2 }}>Ilość</div>
                    <div style={{ fontWeight: 600 }}>{item.quantity} szt.</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 2 }}>📦 Magazyn</div>
                    <div style={{ fontWeight: 600, color: (item.product.inventory?.currentStock || 0) >= item.quantity ? "var(--success)" : "var(--warn)" }}>
                      {item.product.inventory?.currentStock || 0} szt.
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 2 }}>Cena jedn.</div>
                    <div style={{ fontWeight: 600 }}>{sellingPrice.toFixed(2)} {item.currency}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 2 }}>Rabat</div>
                    {item.discountValue ? (
                      <div style={{ fontWeight: 600, color: "var(--warn)" }}>
                        {item.discountType === "PERCENT" ? `${item.discountValue}%` : `${item.discountValue} ${item.currency}`}
                      </div>
                    ) : (
                      <div style={{ color: "var(--ink-3)" }}>—</div>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 2 }}>Razem</div>
                    <div style={{ fontWeight: 600, color: "var(--brand)" }}>{(item.finalPrice || 0).toFixed(2)} {item.currency}</div>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      onClick={() => handleEdit(item)}
                      style={{
                        padding: "4px 8px",
                        background: "var(--brand)",
                        color: "white",
                        border: "none",
                        borderRadius: "var(--r-sm)",
                        cursor: "pointer",
                        fontSize: 12,
                        flex: 1,
                      }}
                    >
                      Edytuj
                    </button>
                    <button
                      onClick={() => setPendingItemId(item.id)}
                      style={{
                        padding: "4px 8px",
                        background: "var(--warn-soft)",
                        color: "var(--warn)",
                        border: "1px solid var(--warn)",
                        borderRadius: "var(--r-sm)",
                        cursor: "pointer",
                        fontSize: 12,
                        flex: 1,
                      }}
                    >
                      ⏳ Później
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.product.name}</div>
                      <div style={{ fontSize: 11, color: "var(--ink-3)" }}>SKU: {item.product.sku}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 2 }}>Cena sprzedaży</div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{sellingPrice.toFixed(2)} zł</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 2 }}>📦 Na magazynie</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: (item.product.inventory?.currentStock || 0) >= item.quantity ? "var(--success)" : "var(--warn)" }}>
                        {item.product.inventory?.currentStock || 0} szt.
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                        Waluta
                      </label>
                      <select
                        value={data?.currency || partner.currency}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [item.id]: { ...data, currency: e.target.value },
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          border: "1px solid var(--ink-2)",
                          borderRadius: "var(--r-sm)",
                          fontSize: 12,
                        }}
                      >
                        <option value="PLN">PLN</option>
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                        Kurs wymiany
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        value={data?.exchangeRate || 1}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [item.id]: { ...data, exchangeRate: parseFloat(e.target.value) },
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          border: "1px solid var(--ink-2)",
                          borderRadius: "var(--r-sm)",
                          fontSize: 12,
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                        Typ rabatu
                      </label>
                      <select
                        value={data?.discountType || "PERCENT"}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [item.id]: { ...data, discountType: e.target.value },
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          border: "1px solid var(--ink-2)",
                          borderRadius: "var(--r-sm)",
                          fontSize: 12,
                        }}
                      >
                        <option value="PERCENT">%</option>
                        <option value="AMOUNT">zł</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                        Wysokość rabatu
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={data?.discountValue || 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [item.id]: { ...data, discountValue: parseFloat(e.target.value) },
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          border: "1px solid var(--ink-2)",
                          borderRadius: "var(--r-sm)",
                          fontSize: 12,
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                      Notatka (WZ numer, itp.)
                    </label>
                    <input
                      type="text"
                      value={data?.notes || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [item.id]: { ...data, notes: e.target.value },
                        })
                      }
                      placeholder="np. WZ/2024/001"
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        border: "1px solid var(--ink-2)",
                        borderRadius: "var(--r-sm)",
                        fontSize: 12,
                      }}
                    />
                  </div>

                  <div
                    style={{
                      background: "var(--surface-2)",
                      padding: 12,
                      borderRadius: "var(--r-sm)",
                      marginBottom: 16,
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 16,
                      fontSize: 12,
                    }}
                  >
                    <div>
                      <div style={{ color: "var(--ink-3)", marginBottom: 2 }}>Cena sprzedaży</div>
                      <div style={{ fontWeight: 600 }}>{sellingPrice.toFixed(2)} {data?.currency || partner.currency}</div>
                    </div>
                    <div>
                      <div style={{ color: "var(--ink-3)", marginBottom: 2 }}>Rabat</div>
                      <div style={{ fontWeight: 600, color: "var(--warn)" }}>
                        {data?.discountType === "PERCENT" && data?.discountValue
                          ? `${((sellingPrice * data.discountValue) / 100).toFixed(2)} ${data.currency || partner.currency}`
                          : data?.discountValue
                          ? `${data.discountValue} ${data.currency || partner.currency}`
                          : "0"}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "var(--ink-3)", marginBottom: 2 }}>Finalna cena</div>
                      <div
                        style={{
                          fontWeight: 600,
                          color: isLowMargin ? "var(--danger)" : "var(--brand)",
                        }}
                      >
                        {finalPrice.toFixed(2)} {data?.currency || partner.currency}
                      </div>
                    </div>
                  </div>

                  {isLowMargin && (
                    <div
                      style={{
                        padding: 8,
                        background: "var(--danger-soft)",
                        color: "var(--danger)",
                        borderRadius: "var(--r-sm)",
                        marginBottom: 16,
                        fontSize: 12,
                      }}
                    >
                      ❌ Marża za niska ({marginPercent.toFixed(1)}%). Minimum: {minMargin}%
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => handleSave(item)}
                      disabled={loading || isLowMargin}
                      style={{
                        padding: "6px 12px",
                        background: isLowMargin ? "var(--ink-2)" : "var(--brand)",
                        color: "white",
                        border: "none",
                        borderRadius: "var(--r-sm)",
                        cursor: isLowMargin || loading ? "not-allowed" : "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                        opacity: isLowMargin || loading ? 0.6 : 1,
                      }}
                    >
                      {loading ? "Zapisuję..." : "Zapisz"}
                    </button>
                    <button
                      onClick={() => setEditingItemId(null)}
                      style={{
                        padding: "6px 12px",
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
