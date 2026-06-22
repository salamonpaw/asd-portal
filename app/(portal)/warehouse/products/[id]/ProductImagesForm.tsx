"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { updateProductImages } from "@/lib/actions/products";

interface ProductImagesFormProps {
  productId: string;
  currentImages: string[];
}

export function ProductImagesForm({ productId, currentImages }: ProductImagesFormProps) {
  const [images, setImages] = useState<string[]>(currentImages);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const addImage = () => {
    if (!newImageUrl.trim()) {
      setError("Wpisz URL zdjęcia");
      return;
    }
    if (!newImageUrl.startsWith("http")) {
      setError("URL musi zaczynać się od http:// lub https://");
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
    if (images.length === 0) {
      setError("Dodaj co najmniej jedno zdjęcie");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await updateProductImages(productId, images);

      setLoading(false);
      if (result.success) {
        setSuccess(`Zapisano ${images.length} zdjęć`);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(result.error || "Błąd");
      }
    } catch (err) {
      setLoading(false);
      setError("Błąd przy zapisywaniu");
    }
  };

  return (
    <div
      style={{
        background: "var(--paper)",
        border: "1px solid var(--ink-2)",
        borderRadius: "var(--r)",
        padding: 24,
      }}
    >
      <h3 style={{ marginBottom: 16 }}>Zarządzaj zdjęciami produktu</h3>

      {error && (
        <div style={{ padding: 12, background: "var(--danger-soft)", borderRadius: "var(--r-sm)", color: "var(--danger)", marginBottom: 16, fontSize: 12 }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: 12, background: "var(--success-soft)", borderRadius: "var(--r-sm)", color: "var(--success)", marginBottom: 16, fontSize: 12 }}>
          ✓ {success}
        </div>
      )}

      {/* Add image form */}
      <div style={{ marginBottom: 24, padding: 16, background: "var(--surface-2)", borderRadius: "var(--r-sm)" }}>
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
              fontWeight: 500,
            }}
          >
            <Icon name="plus" size={14} /> Dodaj
          </button>
        </div>
      </div>

      {/* Images list */}
      {images.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 12, fontWeight: 600 }}>
            Zdjęcia ({images.length})
          </div>
          <div style={{ display: "grid", gap: 8 }}>
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
                <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      background: "var(--paper)",
                      borderRadius: "var(--r-sm)",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={img}
                      alt={`Preview ${idx + 1}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 4 }}>Zdjęcie {idx + 1}</div>
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
          </div>
        </div>
      )}

      {/* Save button */}
      {images.length > 0 && (
        <button
          onClick={saveImages}
          disabled={loading || images.length === 0}
          style={{
            width: "100%",
            padding: "12px 16px",
            background: images.length > 0 ? "var(--success)" : "var(--ink-4)",
            color: "white",
            border: "none",
            borderRadius: "var(--r-sm)",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: 14,
            fontWeight: 600,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Zapisywanie..." : `Zapisz ${images.length} zdjęć`}
        </button>
      )}
    </div>
  );
}
