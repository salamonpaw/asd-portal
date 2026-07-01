"use client";

import { useState } from "react";
import { uploadProductImage, deleteProductImage } from "@/lib/actions/image-management";
import { updateProduct, createProductAsWarehouse } from "@/lib/actions/products";
import { PRODUCT_LOCATIONS, getLocationLabel, getLocationIcon } from "@/lib/constants/product-locations";

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  location: string | null;
  machineTypeId: string;
  productImages: { id: string; filePath: string; fileName: string }[];
}

interface Props {
  initialProducts: Product[];
  machineTypeId: string;
}

export function WarehouseProductsClient({ initialProducts, machineTypeId }: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [selectedProductId, setSelectedProductId] = useState(products.length > 0 ? products[0].id : "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingDescription, setEditingDescription] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState("");
  const [locationValue, setLocationValue] = useState("");
  const [savingDescription, setSavingDescription] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newProductForm, setNewProductForm] = useState({
    sku: "",
    name: "",
    description: "",
    location: "",
  });

  const currentProduct = products.find((p) => p.id === selectedProductId);

  // Filter products by search query
  const filteredProducts = searchQuery.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;

  // Group filtered products by location
  const productsByLocation = PRODUCT_LOCATIONS.reduce((acc, loc) => {
    const productsInLocation = filteredProducts.filter((p) => p.location === loc.value);
    if (productsInLocation.length > 0) {
      acc[loc.value] = { label: loc.label, icon: loc.icon, products: productsInLocation };
    }
    return acc;
  }, {} as Record<string, any>);

  const unassignedProducts = filteredProducts.filter((p) => !p.location);
  if (unassignedProducts.length > 0) {
    productsByLocation["unassigned"] = {
      label: "Nie przypisane",
      icon: "❓",
      products: unassignedProducts,
    };
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    if (!selectedProductId) {
      setError("Wybierz produkt przed wgraniem zdjęcia");
      e.target.value = "";
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("file", e.target.files[0]);

    const result = await uploadProductImage(selectedProductId, formData);

    setUploading(false);

    if (result.success) {
      setSuccess("Zdjęcie wgrane pomyślnie");
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      setTimeout(() => window.location.reload(), 1500);
    } else {
      setError(result.error || "Błąd przy wgrywaniu");
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = "";
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

  const handleEditDescription = () => {
    if (currentProduct) {
      setDescriptionValue(currentProduct.description || "");
      setEditingDescription(true);
    }
  };

  const handleSaveDescription = async () => {
    if (!selectedProductId) return;

    setSavingDescription(true);
    setError("");

    const result = await updateProduct(selectedProductId, {
      description: descriptionValue || undefined,
    });

    setSavingDescription(false);

    if (result.success) {
      setSuccess("Opis został zaktualizowany");
      setEditingDescription(false);
      setTimeout(() => window.location.reload(), 1500);
    } else {
      setError(result.error || "Błąd przy zapisywaniu opisu");
    }
  };

  const handleEditLocation = () => {
    if (currentProduct) {
      setLocationValue(currentProduct.location || "");
      setEditingLocation(true);
    }
  };

  const handleSaveLocation = async () => {
    if (!selectedProductId) return;

    setSavingLocation(true);
    setError("");

    const result = await updateProduct(selectedProductId, {
      location: locationValue || undefined,
    });

    setSavingLocation(false);

    if (result.success) {
      setSuccess("Lokalizacja została zaktualizowana");
      setEditingLocation(false);
      setTimeout(() => window.location.reload(), 1500);
    } else {
      setError(result.error || "Błąd przy zapisywaniu lokalizacji");
    }
  };

  const handleCreateProduct = async () => {
    if (!newProductForm.sku.trim() || !newProductForm.name.trim()) {
      setError("SKU i nazwa są wymagane");
      return;
    }

    setCreatingProduct(true);
    setError("");

    const result = await createProductAsWarehouse({
      sku: newProductForm.sku,
      name: newProductForm.name,
      description: newProductForm.description || undefined,
      location: newProductForm.location || undefined,
      machineTypeId,
    });

    setCreatingProduct(false);

    if (result.success) {
      setSuccess("Produkt został dodany");
      setNewProductForm({ sku: "", name: "", description: "", location: "" });
      setShowCreateForm(false);
      setTimeout(() => window.location.reload(), 1500);
    } else {
      setError(result.error || "Błąd przy tworzeniu produktu");
    }
  };

  const handleCancelDescription = () => {
    setEditingDescription(false);
    setDescriptionValue("");
  };

  const handleCancelLocation = () => {
    setEditingLocation(false);
    setLocationValue("");
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

      {/* Search and Create button */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, marginBottom: 24 }}>
        <input
          type="text"
          placeholder="Szukaj po nazwie lub SKU..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: "8px 12px",
            border: "1px solid var(--ink-2)",
            borderRadius: "var(--r-sm)",
            fontSize: 13,
            fontFamily: "inherit",
            background: "var(--paper)",
          }}
        />
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            padding: "8px 16px",
            background: "var(--brand)",
            color: "white",
            border: "none",
            borderRadius: "var(--r-sm)",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
            whiteSpace: "nowrap",
          }}
        >
          {showCreateForm ? "Anuluj" : "+ Dodaj nowy"}
        </button>
      </div>

      {/* Create product form */}
      {showCreateForm && (
        <div
          style={{
            background: "var(--paper)",
            border: "1px solid var(--ink-2)",
            borderRadius: "var(--r)",
            padding: 24,
            marginBottom: 32,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Nowy produkt</h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontSize: 12, fontWeight: 600 }}>SKU *</label>
              <input
                type="text"
                value={newProductForm.sku}
                onChange={(e) => setNewProductForm({ ...newProductForm, sku: e.target.value })}
                placeholder="np. 00078"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid var(--ink-2)",
                  borderRadius: "var(--r-sm)",
                  fontSize: 13,
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontSize: 12, fontWeight: 600 }}>Nazwa *</label>
              <input
                type="text"
                value={newProductForm.name}
                onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                placeholder="np. B - blokada dolna drzwi prawe"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid var(--ink-2)",
                  borderRadius: "var(--r-sm)",
                  fontSize: 13,
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 4, fontSize: 12, fontWeight: 600 }}>Lokalizacja</label>
            <select
              value={newProductForm.location}
              onChange={(e) => setNewProductForm({ ...newProductForm, location: e.target.value })}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid var(--ink-2)",
                borderRadius: "var(--r-sm)",
                fontSize: 13,
              }}
            >
              <option value="">-- Wybierz lokalizację --</option>
              {PRODUCT_LOCATIONS.map((loc) => (
                <option key={loc.value} value={loc.value}>
                  {loc.icon} {loc.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 4, fontSize: 12, fontWeight: 600 }}>Opis</label>
            <textarea
              value={newProductForm.description}
              onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })}
              placeholder="Opcjonalny opis produktu..."
              style={{
                width: "100%",
                minHeight: "80px",
                padding: "8px 12px",
                border: "1px solid var(--ink-2)",
                borderRadius: "var(--r-sm)",
                fontSize: 13,
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          </div>

          <button
            onClick={handleCreateProduct}
            disabled={creatingProduct}
            style={{
              padding: "8px 16px",
              background: "var(--brand)",
              color: "white",
              border: "none",
              borderRadius: "var(--r-sm)",
              cursor: "pointer",
              fontWeight: 600,
              opacity: creatingProduct ? 0.6 : 1,
            }}
          >
            {creatingProduct ? "Tworzę..." : "Utwórz produkt"}
          </button>
        </div>
      )}

      {/* Products and Edit Panel - 2 Column Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginTop: 24 }}>
        {/* Left: Products grouped by location */}
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            Produkty ({filteredProducts.length}{searchQuery && ` z ${products.length}`})
          </h2>

          {Object.keys(productsByLocation).length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", background: "var(--surface-2)", borderRadius: "var(--r)", color: "var(--ink-3)" }}>
              {searchQuery ? "Nie znaleziono produktów" : "Brak produktów"}
            </div>
          ) : (
            Object.entries(productsByLocation).map(([locationKey, locationData]) => (
            <div key={locationKey} style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "8px 12px",
                  background: "var(--surface-2)",
                  borderRadius: "var(--r-sm)",
                  marginBottom: 12,
                }}
              >
                {locationData.icon} {locationData.label}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {locationData.products.map((product: Product) => (
                  <div
                    key={product.id}
                    onClick={() => setSelectedProductId(product.id)}
                    style={{
                      padding: 12,
                      background: selectedProductId === product.id ? "var(--brand-soft)" : "var(--paper)",
                      border: selectedProductId === product.id ? "2px solid var(--brand)" : "1px solid var(--ink-2)",
                      borderRadius: "var(--r-sm)",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{product.name}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)" }}>SKU: {product.sku}</div>
                  </div>
                ))}
              </div>
            </div>
          )))}
        </div>

        {/* Right: Edit selected product */}
        {currentProduct ? (
          <div>
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

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                  Lokalizacja
                  {!editingLocation && (
                    <button
                      onClick={handleEditLocation}
                      disabled={savingLocation}
                      style={{
                        fontSize: 12,
                        padding: "4px 8px",
                        background: "var(--brand-soft)",
                        color: "var(--brand)",
                        border: "none",
                        borderRadius: "var(--r-sm)",
                        cursor: "pointer",
                      }}
                    >
                      Edytuj
                    </button>
                  )}
                </div>
                {editingLocation ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <select
                      value={locationValue}
                      onChange={(e) => setLocationValue(e.target.value)}
                      disabled={savingLocation}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid var(--ink-2)",
                        borderRadius: "var(--r-sm)",
                        fontSize: 13,
                      }}
                    >
                      <option value="">-- Wybierz lokalizację --</option>
                      {PRODUCT_LOCATIONS.map((loc) => (
                        <option key={loc.value} value={loc.value}>
                          {loc.icon} {loc.label}
                        </option>
                      ))}
                    </select>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={handleSaveLocation}
                        disabled={savingLocation}
                        style={{
                          padding: "6px 12px",
                          background: "var(--brand)",
                          color: "white",
                          border: "none",
                          borderRadius: "var(--r-sm)",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          opacity: savingLocation ? 0.6 : 1,
                        }}
                      >
                        {savingLocation ? "Zapisuję..." : "Zapisz"}
                      </button>
                      <button
                        onClick={handleCancelLocation}
                        disabled={savingLocation}
                        style={{
                          padding: "6px 12px",
                          background: "var(--surface-2)",
                          color: "var(--ink)",
                          border: "none",
                          borderRadius: "var(--r-sm)",
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        Anuluj
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 13 }}>
                    {getLocationIcon(currentProduct.location)} {getLocationLabel(currentProduct.location)}
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  Opis
                  {!editingDescription && (
                    <button
                      onClick={handleEditDescription}
                      disabled={savingDescription}
                      style={{
                        fontSize: 12,
                        padding: "4px 8px",
                        background: "var(--brand-soft)",
                        color: "var(--brand)",
                        border: "none",
                        borderRadius: "var(--r-sm)",
                        cursor: "pointer",
                      }}
                    >
                      Edytuj
                    </button>
                  )}
                </div>
                {editingDescription ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <textarea
                      value={descriptionValue}
                      onChange={(e) => setDescriptionValue(e.target.value)}
                      disabled={savingDescription}
                      style={{
                        width: "100%",
                        minHeight: "100px",
                        padding: "8px 12px",
                        border: "1px solid var(--ink-2)",
                        borderRadius: "var(--r-sm)",
                        fontSize: 13,
                        fontFamily: "inherit",
                        background: "var(--paper)",
                        resize: "vertical",
                      }}
                      placeholder="Wpisz opis produktu..."
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={handleSaveDescription}
                        disabled={savingDescription}
                        style={{
                          padding: "6px 12px",
                          background: "var(--brand)",
                          color: "white",
                          border: "none",
                          borderRadius: "var(--r-sm)",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          opacity: savingDescription ? 0.6 : 1,
                        }}
                      >
                        {savingDescription ? "Zapisuję..." : "Zapisz"}
                      </button>
                      <button
                        onClick={handleCancelDescription}
                        disabled={savingDescription}
                        style={{
                          padding: "6px 12px",
                          background: "var(--surface-2)",
                          color: "var(--ink)",
                          border: "none",
                          borderRadius: "var(--r-sm)",
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        Anuluj
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: currentProduct.description ? "var(--ink)" : "var(--ink-3)", whiteSpace: "pre-wrap" }}>
                    {currentProduct.description || "Brak opisu"}
                  </div>
                )}
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
        ) : (
          <div style={{ padding: 32, textAlign: "center", background: "var(--paper)", borderRadius: "var(--r)", border: "1px solid var(--ink-2)" }}>
            <div style={{ fontSize: 14, color: "var(--ink-3)", marginBottom: 8 }}>Wybierz produkt z listy po lewej</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)" }}>aby edytować opis, lokalizację i dodawać zdjęcia</div>
          </div>
        )}
      </div>
    </div>
  );
}
