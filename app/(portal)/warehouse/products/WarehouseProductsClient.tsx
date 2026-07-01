"use client";

import { useState } from "react";
import { uploadProductImage, deleteProductImage } from "@/lib/actions/image-management";

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  productImages: { id: string; filePath: string; fileName: string }[];
}

interface Props {
  initialProducts: Product[];
}

export function WarehouseProductsClient({ initialProducts }: Props) {
  const [products] = useState(initialProducts);
  const [selectedProductId, setSelectedProductId] = useState(products.length > 0 ? products[0].id : "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const currentProduct = products.find((p) => p.id === selectedProductId);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedProductId || !e.target.files?.length) return;

    setUploading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("file", e.target.files[0]);

    const result = await uploadProductImage(selectedProductId, formData);

    setUploading(false);

    if (result.success) {
      setSuccess("Zdjęcie wgrane pomyślnie");
      setTimeout(() => window.location.reload(), 1500);
    } else {
      setError(result.error || "Błąd przy wgrywaniu");
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm("Na pewno usunąć to zdjęcie?")) return;

    setError("");
    const result = await deleteProductImage(imageId);

    if (result.success) {
      setSuccess("Zdjęcie usunięte");
      setTimeout(() => window.location.reload(), 1500);
    } else {
      setError(result.error || "Błąd przy usuwaniu");
    }
  };

  return (
    <div>
      {error && (
        <div
          style={{
            padding: 16,
            background: "var(--danger-soft)",
            color: "var(--danger)",
            borderRadius: "var(--r-sm)",
            marginBottom: 24,
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: 16,
            background: "var(--success-soft)",
            color: "var(--success)",
            borderRadius: "var(--r-sm)",
            marginBottom: 24,
          }}
        >
          {success}
        </div>
      )}

      {/* Product Selector */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
          Wybierz produkt do edycji
        </label>
        <select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "400px",
            padding: "8px 12px",
            border: "1px solid var(--ink-2)",
            borderRadius: "var(--r-sm)",
            fontSize: 14,
            fontFamily: "inherit",
            background: "var(--paper)",
            cursor: "pointer",
          }}
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} (SKU: {p.sku})
            </option>
          ))}
        </select>
      </div>

      {currentProduct && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          {/* Product Info */}
          <div>
            <div style={{ background: "var(--paper)", border: "1px solid var(--ink-2)", borderRadius: "var(--r)", padding: 24 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Informacja o produkcie</h2>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 4 }}>SKU</div>
                <div style={{ fontSize: 13, fontFamily: "monospace" }}>{currentProduct.sku}</div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 4 }}>Nazwa</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{currentProduct.name}</div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 4 }}>Opis</div>
                <div style={{ fontSize: 13, color: currentProduct.description ? "var(--ink)" : "var(--ink-3)" }}>
                  {currentProduct.description || "Brak opisu"}
                </div>
              </div>
            </div>
          </div>

          {/* Images */}
          <div>
            <div style={{ background: "var(--paper)", border: "1px solid var(--ink-2)", borderRadius: "var(--r)", padding: 24 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Zdjęcia produktu</h2>

              {/* Upload */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", marginBottom: 8, fontSize: 12, fontWeight: 600 }}>
                  Dodaj zdjęcie
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  style={{
                    display: "block",
                    padding: "8px 12px",
                    border: "1px solid var(--ink-2)",
                    borderRadius: "var(--r-sm)",
                    fontSize: 13,
                    cursor: uploading ? "not-allowed" : "pointer",
                    width: "100%",
                  }}
                />
              </div>

              {/* Images Grid */}
              {currentProduct.productImages.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 12 }}>
                  {currentProduct.productImages.map((img) => (
                    <div
                      key={img.id}
                      style={{
                        position: "relative",
                        borderRadius: "var(--r-sm)",
                        overflow: "hidden",
                        background: "var(--surface-2)",
                      }}
                    >
                      <img
                        src={img.filePath}
                        alt={img.fileName}
                        style={{
                          width: "100%",
                          height: "100px",
                          objectFit: "cover",
                        }}
                      />
                      <button
                        onClick={() => handleDeleteImage(img.id)}
                        disabled={uploading}
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          background: "rgba(0, 0, 0, 0.5)",
                          color: "white",
                          border: "none",
                          borderRadius: "var(--r-sm)",
                          padding: "4px 6px",
                          cursor: uploading ? "not-allowed" : "pointer",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: 24, color: "var(--ink-3)", fontSize: 12 }}>
                  Brak zdjęć. Dodaj pierwsze.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
