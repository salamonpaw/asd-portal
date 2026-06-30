"use client";

import { useState } from "react";
import { createOrderTemplate, updateOrderTemplate, deleteOrderTemplate, getPartnerTemplates } from "@/lib/actions/order-templates";
import { db } from "@/lib/db";

interface TemplateItem {
  productId: string;
  quantity: number;
  product?: { id: string; name: string; sku: string };
}

interface Template {
  id: string;
  name: string;
  items: TemplateItem[];
  createdAt: Date;
}

interface OrderTemplatesClientProps {
  initialTemplates: Template[];
  partnerId: string;
}

export function OrderTemplatesClient({ initialTemplates, partnerId }: OrderTemplatesClientProps) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({ name: "", items: [] as TemplateItem[] });
  const [selectedProducts, setSelectedProducts] = useState<{ [key: string]: number }>({});

  const handleSave = async () => {
    setError("");
    setSuccess("");

    if (!formData.name.trim()) {
      setError("Nazwa szablonu jest wymagana");
      return;
    }

    if (formData.items.length === 0) {
      setError("Dodaj co najmniej jeden produkt");
      return;
    }

    setLoading(true);

    try {
      let result;
      if (editingId) {
        result = await updateOrderTemplate(editingId, {
          name: formData.name,
          items: formData.items,
        });
      } else {
        result = await createOrderTemplate(partnerId, {
          name: formData.name,
          items: formData.items,
        });
      }

      if (result.success) {
        setSuccess(editingId ? "✓ Szablon zaktualizowany" : "✓ Szablon utworzony");
        setFormData({ name: "", items: [] });
        setSelectedProducts({});
        setShowCreate(false);
        setEditingId(null);

        // Refresh templates
        const refreshResult = await getPartnerTemplates(partnerId);
        if (refreshResult.success && "data" in refreshResult) {
          setTemplates(refreshResult.data);
        }

        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(result.error || "Błąd");
      }
    } catch (e) {
      setError("Błąd przy zapisywaniu");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm("Usunąć ten szablon?")) return;

    setLoading(true);
    const result = await deleteOrderTemplate(templateId);

    if (result.success) {
      setSuccess("✓ Szablon usunięty");
      setTemplates(templates.filter((t) => t.id !== templateId));
      setTimeout(() => setSuccess(""), 3000);
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

      {/* Create/Edit Form */}
      {showCreate && (
        <div
          style={{
            background: "var(--paper)",
            border: "1px solid var(--ink-2)",
            borderRadius: "var(--r)",
            padding: 24,
            marginBottom: 24,
          }}
        >
          <h2 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>
            {editingId ? "Edytuj szablon" : "Nowy szablon"}
          </h2>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
              Nazwa szablonu *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="np. Serwis A - Części standardowe"
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid var(--ink-2)",
                borderRadius: "var(--r-sm)",
                fontSize: 13,
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Produkty ({formData.items.length})</p>
            {formData.items.length > 0 && (
              <div style={{ background: "var(--surface-2)", borderRadius: "var(--r-sm)", padding: 12, marginBottom: 12 }}>
                {formData.items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                      borderBottom: idx < formData.items.length - 1 ? "1px solid var(--ink-2)" : "none",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{item.product?.name}</div>
                      <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{item.product?.sku}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{item.quantity} szt.</div>
                      <button
                        onClick={() =>
                          setFormData({
                            ...formData,
                            items: formData.items.filter((_, i) => i !== idx),
                          })
                        }
                        style={{
                          padding: "4px 8px",
                          background: "var(--danger)",
                          color: "white",
                          border: "none",
                          borderRadius: "var(--r-sm)",
                          cursor: "pointer",
                          fontSize: 11,
                        }}
                      >
                        Usuń
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 8 }}>
              (Dodawanie produktów — wymagane API. Na razie lista statyczna.)
            </p>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleSave}
              disabled={loading}
              style={{
                padding: "8px 16px",
                background: "var(--brand)",
                color: "white",
                border: "none",
                borderRadius: "var(--r-sm)",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 12,
                fontWeight: 600,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Zapisuję..." : editingId ? "Zaktualizuj" : "Utwórz"}
            </button>
            <button
              onClick={() => {
                setShowCreate(false);
                setEditingId(null);
                setFormData({ name: "", items: [] });
              }}
              style={{
                padding: "8px 16px",
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

      {/* Create Button */}
      {!showCreate && (
        <button
          onClick={() => setShowCreate(true)}
          style={{
            padding: "10px 16px",
            background: "var(--brand)",
            color: "white",
            border: "none",
            borderRadius: "var(--r-sm)",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 24,
          }}
        >
          + Nowy szablon
        </button>
      )}

      {/* Templates List */}
      <div style={{ background: "var(--paper)", border: "1px solid var(--ink-2)", borderRadius: "var(--r)", overflow: "hidden" }}>
        {templates.length > 0 ? (
          templates.map((template, idx) => (
            <div
              key={template.id}
              style={{
                padding: 16,
                borderBottom: idx < templates.length - 1 ? "1px solid var(--ink-2)" : "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{template.name}</h3>
                  <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                    {template.items.length} produktów • {new Date(template.createdAt).toLocaleDateString("pl")}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => {
                      setEditingId(template.id);
                      setFormData({ name: template.name, items: template.items });
                      setShowCreate(true);
                    }}
                    style={{
                      padding: "4px 8px",
                      background: "var(--brand)",
                      color: "white",
                      border: "none",
                      borderRadius: "var(--r-sm)",
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    Edytuj
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    disabled={loading}
                    style={{
                      padding: "4px 8px",
                      background: "var(--danger)",
                      color: "white",
                      border: "none",
                      borderRadius: "var(--r-sm)",
                      cursor: "pointer",
                      fontSize: 12,
                      opacity: loading ? 0.6 : 1,
                    }}
                  >
                    Usuń
                  </button>
                </div>
              </div>

              {/* Items Preview */}
              <div style={{ fontSize: 12, color: "var(--ink-2)" }}>
                {template.items.slice(0, 3).map((item, i) => (
                  <div key={i}>
                    • {item.product?.sku} — {item.product?.name} ({item.quantity} szt.)
                  </div>
                ))}
                {template.items.length > 3 && (
                  <div style={{ color: "var(--ink-3)", marginTop: 4 }}>+{template.items.length - 3} więcej</div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: 32, textAlign: "center", color: "var(--ink-3)" }}>
            <p>Brak szablonów</p>
            <button
              onClick={() => setShowCreate(true)}
              style={{
                marginTop: 12,
                padding: "8px 16px",
                background: "var(--brand)",
                color: "white",
                border: "none",
                borderRadius: "var(--r-sm)",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Utwórz pierwszy szablon
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
