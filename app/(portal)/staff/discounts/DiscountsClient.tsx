"use client";

import { useState, useEffect } from "react";
import { getRepPartnerDiscounts, createPartnerDiscount, updatePartnerDiscount, deletePartnerDiscount } from "@/lib/actions/discount";
import { Icon } from "@/components/ui/Icon";
import type { Partner, PartnerDiscount } from "@prisma/client";

interface PartnerWithDiscounts extends Partner {
  discounts: PartnerDiscount[];
}

interface DiscountFormState {
  partnerId: string;
  percentage: number;
  expirationDate: string;
  fallbackPercentage: number;
  machineCountRequired: number | null;
}

export function DiscountsClient() {
  const [partners, setPartners] = useState<PartnerWithDiscounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<PartnerDiscount | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<DiscountFormState>({
    partnerId: "",
    percentage: 10,
    expirationDate: "",
    fallbackPercentage: 5,
    machineCountRequired: null,
  });

  useEffect(() => {
    loadPartners();
  }, []);

  async function loadPartners() {
    setLoading(true);
    const result = await getRepPartnerDiscounts();
    if (result.success && result.data) {
      setPartners(result.data);
    }
    setLoading(false);
  }

  function openCreateModal(partnerId: string) {
    setEditingDiscount(null);
    setFormData({
      partnerId,
      percentage: 10,
      expirationDate: "",
      fallbackPercentage: 5,
      machineCountRequired: null,
    });
    setFormError(null);
    setFormSuccess(null);
    setShowModal(true);
  }

  function openEditModal(discount: PartnerDiscount) {
    setEditingDiscount(discount);
    setFormData({
      partnerId: discount.partnerId,
      percentage: parseFloat(discount.percentage.toString()),
      expirationDate: new Date(discount.expirationDate).toISOString().split("T")[0],
      fallbackPercentage: parseFloat(discount.fallbackPercentage.toString()),
      machineCountRequired: discount.machineCountRequired,
    });
    setFormError(null);
    setFormSuccess(null);
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!formData.expirationDate) {
      setFormError("Data wygaśnięcia jest wymagana");
      return;
    }

    const expirationDate = new Date(formData.expirationDate);

    if (editingDiscount) {
      const result = await updatePartnerDiscount({
        discountId: editingDiscount.id,
        percentage: formData.percentage,
        expirationDate,
        fallbackPercentage: formData.fallbackPercentage,
        machineCountRequired: formData.machineCountRequired || undefined,
      });

      if (result.success) {
        setFormSuccess("Rabat zaktualizowany");
        setTimeout(() => {
          setShowModal(false);
          loadPartners();
        }, 1500);
      } else {
        setFormError(result.error || "Błąd podczas aktualizacji");
      }
    } else {
      const result = await createPartnerDiscount({
        partnerId: formData.partnerId,
        percentage: formData.percentage,
        expirationDate,
        fallbackPercentage: formData.fallbackPercentage,
        machineCountRequired: formData.machineCountRequired || undefined,
      });

      if (result.success) {
        setFormSuccess("Rabat utworzony");
        setTimeout(() => {
          setShowModal(false);
          loadPartners();
        }, 1500);
      } else {
        setFormError(result.error || "Błąd podczas tworzenia");
      }
    }
  }

  async function handleDelete(discountId: string) {
    if (!confirm("Czy na pewno usunąć ten rabat?")) return;

    const result = await deletePartnerDiscount(discountId);
    if (result.success) {
      loadPartners();
    } else {
      setFormError(result.error || "Błąd podczas usuwania");
    }
  }

  const getDiscountStatus = (expirationDate: Date) => {
    const now = new Date();
    const daysUntilExpiry = Math.ceil((new Date(expirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return { status: "EXPIRED", color: "var(--danger)", label: "Wygasły" };
    if (daysUntilExpiry <= 30) return { status: "EXPIRING_SOON", color: "var(--warn)", label: `Wygasa za ${daysUntilExpiry}d` };
    return { status: "ACTIVE", color: "var(--ok)", label: "Aktywny" };
  };

  if (loading) {
    return (
      <div style={{ padding: "32px", textAlign: "center" }}>
        <Icon name="loader" size={24} style={{ animation: "spin 1s linear infinite" }} />
        <p style={{ marginTop: "16px", color: "var(--ink-3)" }}>Ładowanie rabatów...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "24px" }}>
        {/* Partners List */}
        <div style={{ background: "var(--paper)", borderRadius: "var(--r)", padding: "16px", border: "1px solid var(--ink-2)" }}>
          <h3 style={{ marginBottom: "16px", fontSize: "14px", fontWeight: 600, color: "var(--ink-3)" }}>Moi Partnerzy</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {partners.map((partner) => (
              <button
                key={partner.id}
                onClick={() => setSelectedPartner(partner.id)}
                style={{
                  padding: "12px",
                  background: selectedPartner === partner.id ? "var(--brand-soft)" : "transparent",
                  border: selectedPartner === partner.id ? "1px solid var(--brand)" : "1px solid var(--ink-2)",
                  borderRadius: "var(--r)",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "13px",
                  transition: "all 200ms",
                }}
              >
                <div style={{ fontWeight: 500, marginBottom: "4px" }}>{partner.name}</div>
                <div style={{ fontSize: "11px", color: "var(--ink-3)" }}>
                  {partner.discounts.length} rabat{partner.discounts.length === 1 ? "" : "ów"}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Partner Details & Discounts */}
        <div>
          {selectedPartner ? (
            (() => {
              const partner = partners.find((p) => p.id === selectedPartner);
              return partner ? (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <div>
                      <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "4px" }}>{partner.name}</h2>
                      <p style={{ fontSize: "13px", color: "var(--ink-3)" }}>
                        Miasto: {partner.city} • Poziom: {partner.level} • Default: {partner.discount}%
                      </p>
                    </div>
                    <button
                      onClick={() => openCreateModal(partner.id)}
                      style={{
                        padding: "8px 16px",
                        background: "var(--brand)",
                        color: "white",
                        border: "none",
                        borderRadius: "var(--r)",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Icon name="plus" size={16} />
                      Nowy rabat
                    </button>
                  </div>

                  {/* Discounts List */}
                  {partner.discounts.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {partner.discounts.map((discount) => {
                        const { status, color, label } = getDiscountStatus(discount.expirationDate);
                        return (
                          <div
                            key={discount.id}
                            style={{
                              background: "var(--paper)",
                              border: `1px solid ${color}40`,
                              borderRadius: "var(--r)",
                              padding: "16px",
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr 1fr 1fr auto",
                              gap: "16px",
                              alignItems: "center",
                            }}
                          >
                            <div>
                              <div style={{ fontSize: "11px", color: "var(--ink-3)", marginBottom: "4px", fontWeight: 600 }}>
                                Procent rabatu
                              </div>
                              <div style={{ fontSize: "18px", fontWeight: 600, color: color }}>
                                {discount.percentage.toString()}%
                              </div>
                            </div>

                            <div>
                              <div style={{ fontSize: "11px", color: "var(--ink-3)", marginBottom: "4px", fontWeight: 600 }}>
                                Fallback
                              </div>
                              <div style={{ fontSize: "14px" }}>{discount.fallbackPercentage.toString()}%</div>
                            </div>

                            <div>
                              <div style={{ fontSize: "11px", color: "var(--ink-3)", marginBottom: "4px", fontWeight: 600 }}>
                                Wygasa
                              </div>
                              <div style={{ fontSize: "14px" }}>{new Date(discount.expirationDate).toLocaleDateString("pl")}</div>
                            </div>

                            <div>
                              <div style={{ fontSize: "11px", color: "var(--ink-3)", marginBottom: "4px", fontWeight: 600 }}>
                                Status
                              </div>
                              <div style={{ fontSize: "13px", color, fontWeight: 500 }}>{label}</div>
                            </div>

                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                onClick={() => openEditModal(discount)}
                                style={{
                                  padding: "6px 12px",
                                  background: "var(--ink-2)10",
                                  border: "1px solid var(--ink-2)",
                                  borderRadius: "var(--r)",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                  fontWeight: 500,
                                }}
                              >
                                <Icon name="edit" size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(discount.id)}
                                style={{
                                  padding: "6px 12px",
                                  background: "var(--danger)10",
                                  border: "1px solid var(--danger)40",
                                  borderRadius: "var(--r)",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                  fontWeight: 500,
                                  color: "var(--danger)",
                                }}
                              >
                                <Icon name="trash" size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ padding: "32px", textAlign: "center", background: "var(--surface-2)", borderRadius: "var(--r)", color: "var(--ink-3)" }}>
                      <Icon name="percent" size={32} style={{ opacity: 0.3, marginBottom: "12px" }} />
                      <p>Brak rabatów dla tego partnera</p>
                    </div>
                  )}
                </div>
              ) : null;
            })()
          ) : (
            <div style={{ padding: "32px", textAlign: "center", background: "var(--surface-2)", borderRadius: "var(--r)", color: "var(--ink-3)" }}>
              <p>Wybierz partnera z listy po lewej</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: "var(--paper)",
              borderRadius: "var(--r)",
              padding: "24px",
              maxWidth: "500px",
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>
              {editingDiscount ? "Edytuj rabat" : "Utwórz nowy rabat"}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-3)", display: "block", marginBottom: "6px" }}>
                  Procent rabatu (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={formData.percentage}
                  onChange={(e) => setFormData({ ...formData, percentage: parseFloat(e.target.value) })}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid var(--ink-2)",
                    borderRadius: "var(--r)",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-3)", display: "block", marginBottom: "6px" }}>
                  Data wygaśnięcia
                </label>
                <input
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid var(--ink-2)",
                    borderRadius: "var(--r)",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-3)", display: "block", marginBottom: "6px" }}>
                  Fallback rabat (%) — po wygaśnięciu
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={formData.fallbackPercentage}
                  onChange={(e) => setFormData({ ...formData, fallbackPercentage: parseFloat(e.target.value) })}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid var(--ink-2)",
                    borderRadius: "var(--r)",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-3)", display: "block", marginBottom: "6px" }}>
                  Warunek: min. liczba maszyn (opcjonalnie)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.machineCountRequired ?? ""}
                  onChange={(e) => setFormData({ ...formData, machineCountRequired: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Brak warunku"
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid var(--ink-2)",
                    borderRadius: "var(--r)",
                    fontSize: "14px",
                  }}
                />
              </div>

              {formError && (
                <div style={{ padding: "12px", background: "var(--danger)10", color: "var(--danger)", borderRadius: "var(--r)", fontSize: "13px" }}>
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div style={{ padding: "12px", background: "var(--ok)10", color: "var(--ok)", borderRadius: "var(--r)", fontSize: "13px" }}>
                  {formSuccess}
                </div>
              )}

              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "var(--brand)",
                    color: "white",
                    border: "none",
                    borderRadius: "var(--r)",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  {editingDiscount ? "Zapisz zmiany" : "Utwórz rabat"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "var(--ink-2)20",
                    border: "1px solid var(--ink-2)",
                    borderRadius: "var(--r)",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  Anuluj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
