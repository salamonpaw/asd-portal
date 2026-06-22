"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { updateProduct, updateProductImages } from "@/lib/actions/products";

interface MachineType {
  id: string;
  name: string;
  label: string;
}

interface AdminProductFormProps {
  product: {
    id: string;
    sku: string;
    name: string;
    description: string;
    machineTypeId: string;
    location: string;
    serialNumber: string;
    supplier: string;
    inStock: number | null;
    costPrice: number | null;
    sellingPrice: number | null;
  };
  machineTypes: MachineType[];
  images: string[];
}

export function AdminProductForm({ product, machineTypes, images: initialImages }: AdminProductFormProps) {
  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description,
    machineTypeId: product.machineTypeId,
    location: product.location,
    serialNumber: product.serialNumber,
    supplier: product.supplier,
    inStock: product.inStock,
    costPrice: product.costPrice,
    sellingPrice: product.sellingPrice,
  });

  const [images, setImages] = useState(initialImages);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSave = async () => {
    if (!formData.name || !formData.machineTypeId) {
      setError("Nazwa i typ automatu są wymagane");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await updateProduct(product.id, {
        sku: product.sku,
        name: formData.name,
        description: formData.description,
        machineTypeId: formData.machineTypeId,
        location: formData.location,
        serialNumber: formData.serialNumber,
        supplier: formData.supplier,
        inStock: formData.inStock,
        costPrice: formData.costPrice,
        sellingPrice: formData.sellingPrice,
      });

      setLoading(false);
      if (result.success) {
        setSuccess("Zapisano zmiany");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(result.error || "Błąd");
      }
    } catch (err) {
      setLoading(false);
      setError("Błąd przy zapisywaniu");
    }
  };

  const addImage = () => {
    if (!newImageUrl.trim()) {
      setError("Wpisz URL zdjęcia");
      return;
    }
    if (images.includes(newImageUrl)) {
      setError("To zdjęcie już zostało dodane");
      return;
    }
    setImages([...images, newImageUrl]);
    setNewImageUrl("");
    setError("");
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const saveImages = async () => {
    setLoading(true);
    try {
      await updateProductImages(product.id, images);
      setSuccess("Zapisano zdjęcia");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Błąd przy zapisywaniu zdjęć");
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {error && (
        <div style={{ padding: 12, background: "var(--danger-soft)", borderRadius: "var(--r-sm)", color: "var(--danger)", fontSize: 12 }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: 12, background: "var(--success-soft)", borderRadius: "var(--r-sm)", color: "var(--success)", fontSize: 12 }}>
          ✓ {success}
        </div>
      )}

      {/* Basic Info */}
      <div style={{ background: "var(--paper)", border: "1px solid var(--ink-2)", borderRadius: "var(--r)", padding: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Informacje podstawowe</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div className="field">
            <label>Nazwa *</label>
            <input
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Typ automatu *</label>
            <select
              className="input"
              value={formData.machineTypeId}
              onChange={(e) => setFormData({ ...formData, machineTypeId: e.target.value })}
              style={{ padding: "10px 12px" }}
            >
              {machineTypes.map((mt) => (
                <option key={mt.id} value={mt.id}>
                  {mt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field" style={{ marginBottom: 16 }}>
          <label>Opis</label>
          <textarea
            className="input"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            style={{ minHeight: 100 }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="field">
            <label>Numer seryjny</label>
            <input
              className="input"
              value={formData.serialNumber}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Lokalizacja w maszynie</label>
            <input
              className="input"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Pricing & Stock */}
      <div style={{ background: "var(--paper)", border: "1px solid var(--ink-2)", borderRadius: "var(--r)", padding: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Ceny i magazyn</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <div className="field">
            <label>Cena zakupu (zł)</label>
            <input
              className="input"
              type="number"
              step="0.01"
              min="0"
              value={formData.costPrice || ""}
              onChange={(e) => setFormData({ ...formData, costPrice: e.target.value ? parseFloat(e.target.value) : null })}
            />
          </div>
          <div className="field">
            <label>Cena sprzedaży (zł)</label>
            <input
              className="input"
              type="number"
              step="0.01"
              min="0"
              value={formData.sellingPrice || ""}
              onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value ? parseFloat(e.target.value) : null })}
            />
          </div>
          <div className="field">
            <label>Stan magazynowy</label>
            <input
              className="input"
              type="number"
              min="0"
              value={formData.inStock || ""}
              onChange={(e) => setFormData({ ...formData, inStock: e.target.value ? parseInt(e.target.value) : null })}
            />
          </div>
        </div>
      </div>

      {/* Images */}
      <div style={{ background: "var(--paper)", border: "1px solid var(--ink-2)", borderRadius: "var(--r)", padding: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Zdjęcia produktu</h3>

        <div style={{ marginBottom: 16, padding: 16, background: "var(--surface-2)", borderRadius: "var(--r-sm)" }}>
          <label style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 8, display: "block" }}>Dodaj zdjęcie (URL)</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              placeholder="https://example.com/image.jpg"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addImage()}
              style={{
                flex: 1,
                padding: "8px 12px",
                border: "1px solid var(--ink-2)",
                borderRadius: "var(--r-sm)",
                fontSize: 13,
              }}
            />
            <button
              onClick={addImage}
              style={{
                padding: "8px 16px",
                background: "var(--brand)",
                color: "white",
                border: "none",
                borderRadius: "var(--r-sm)",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              <Icon name="plus" size={14} /> Dodaj
            </button>
          </div>
        </div>

        {images.length > 0 && (
          <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
            {images.map((img, idx) => (
              <div
                key={idx}
                style={{
                  padding: 12,
                  background: "var(--surface-2)",
                  borderRadius: "var(--r-sm)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 4 }}>Zdjęcie {idx + 1}</div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--ink-2)",
                      wordBreak: "break-all",
                      fontFamily: "monospace",
                    }}
                  >
                    {img}
                  </div>
                </div>
                <button
                  onClick={() => removeImage(idx)}
                  style={{
                    padding: "6px 10px",
                    background: "var(--danger-soft)",
                    color: "var(--danger)",
                    border: "none",
                    borderRadius: "var(--r-sm)",
                    cursor: "pointer",
                    marginLeft: 8,
                  }}
                >
                  <Icon name="trash" size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={saveImages}
              disabled={loading}
              style={{
                padding: "10px 16px",
                background: "var(--success)",
                color: "white",
                border: "none",
                borderRadius: "var(--r-sm)",
                cursor: "pointer",
                fontSize: 13,
                opacity: loading ? 0.6 : 1,
              }}
            >
              Zapisz {images.length} zdjęć
            </button>
          </div>
        )}
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={loading}
        style={{
          padding: "12px 24px",
          background: "var(--success)",
          color: "white",
          border: "none",
          borderRadius: "var(--r)",
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: 14,
          fontWeight: 600,
          opacity: loading ? 0.6 : 1,
          width: "100%",
        }}
      >
        {loading ? "Zapisywanie..." : "Zapisz zmiany produktu"}
      </button>
    </div>
  );
}
