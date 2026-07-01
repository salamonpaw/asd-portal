"use client";

import { useEffect, useState } from "react";
import { getAllImages, uploadProductImage, deleteProductImage } from "@/lib/actions/image-management";
import { getProducts } from "@/lib/actions/products";
import { Icon } from "@/components/ui/Icon";

interface ProductImage {
  id: string;
  productId: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
  uploadedBy: string;
  product: { id: string; name: string; sku: string } | null;
}

interface Product {
  id: string;
  name: string;
  sku: string;
}

export function ImageGalleryClient() {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [imagesResult, productsResult] = await Promise.all([
        getAllImages(),
        getProducts(),
      ]);

      if (imagesResult.success && imagesResult.data) {
        setImages(imagesResult.data as ProductImage[]);
      } else {
        setError(imagesResult.error || "Nie udało się załadować zdjęć");
      }

      if (productsResult.success && productsResult.data) {
        setProducts(
          productsResult.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
          }))
        );
      }

      setLoading(false);
    };
    load();
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFiles = async (files: FileList) => {
    if (files.length === 0) return;

    if (!selectedProductId) {
      setError("Wybierz produkt");
      return;
    }

    const file = files[0];

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadProductImage(selectedProductId, formData);

    setUploading(false);

    if (result.success) {
      setSelectedProductId("");
      const imagesResult = await getAllImages();
      if (imagesResult.success && imagesResult.data) {
        setImages(imagesResult.data as ProductImage[]);
      }
    } else {
      setError(result.error || "Błąd przy wgrywaniu");
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm("Na pewno usunąć to zdjęcie?")) return;

    const result = await deleteProductImage(imageId);
    if (result.success) {
      await loadImages();
    } else {
      setError(result.error || "Błąd przy usuwaniu");
    }
  };

  if (loading) {
    return <div style={{ padding: 32, textAlign: "center" }}>Ładowanie...</div>;
  }

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

      {/* Product Selector */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
          Wybierz produkt
        </label>
        <select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          disabled={uploading}
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid var(--ink-2)",
            borderRadius: "var(--r-sm)",
            fontSize: 14,
            fontFamily: "inherit",
            background: "var(--paper)",
            cursor: uploading ? "not-allowed" : "pointer",
            opacity: uploading ? 0.6 : 1,
          }}
        >
          <option value="">-- Wybierz produkt --</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} (SKU: {p.sku})
            </option>
          ))}
        </select>
      </div>

      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        style={{
          border: dragActive ? "2px dashed var(--brand)" : "2px dashed var(--ink-2)",
          borderRadius: "var(--r)",
          padding: 40,
          textAlign: "center",
          marginBottom: 32,
          background: dragActive ? "rgba(0, 102, 255, 0.05)" : "var(--surface-2)",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
      >
        <input
          type="file"
          id="fileInput"
          multiple={false}
          accept="image/*"
          onChange={handleChange}
          disabled={uploading}
          style={{ display: "none" }}
        />
        <label
          htmlFor="fileInput"
          style={{ cursor: uploading ? "not-allowed" : "pointer", display: "block" }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>📸</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
            {uploading ? "Wgrywam..." : "Przeciągnij zdjęcie lub kliknij aby wybrać"}
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
            Obsługiwane: JPEG, PNG, WebP, GIF (maks. 5MB)
          </div>
        </label>
      </div>

      {/* Gallery */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
          Wgrane zdjęcia ({images.length})
        </h2>

        {images.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 16,
            }}
          >
            {images.map((image) => (
              <div
                key={image.id}
                style={{
                  background: "var(--paper)",
                  border: "1px solid var(--ink-2)",
                  borderRadius: "var(--r)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: 150,
                    background: "var(--surface-2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={image.filePath}
                    alt={image.fileName}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>

                <div style={{ padding: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {image.product?.name || "Brak produktu"}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 2 }}>
                    {image.product?.sku && `SKU: ${image.product.sku}`}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--ink-3)", marginBottom: 8 }}>
                    {(image.fileSize / 1024).toFixed(1)} KB • {new Date(image.uploadedAt).toLocaleDateString("pl")}
                  </div>

                  <button
                    onClick={() => handleDelete(image.id)}
                    disabled={uploading}
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      background: "var(--danger-soft)",
                      color: "var(--danger)",
                      border: "none",
                      borderRadius: "var(--r-sm)",
                      cursor: uploading ? "not-allowed" : "pointer",
                      fontSize: 11,
                      fontWeight: 600,
                      opacity: uploading ? 0.6 : 1,
                    }}
                  >
                    ✕ Usuń
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: 32, textAlign: "center", background: "var(--surface-2)", borderRadius: "var(--r)", color: "var(--ink-3)" }}>
            Brak wgranych zdjęć. Przeciągnij lub kliknij aby dodać.
          </div>
        )}
      </div>
    </div>
  );
}
