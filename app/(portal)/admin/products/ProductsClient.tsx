"use client";

import { useState } from "react";
import { createProduct, updateProduct, deleteProduct, ProductInput } from "@/lib/actions/products";
import { Icon } from "@/components/ui/Icon";

type Product = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  machineTypeId: string;
  location: string | null;
  image: string | null;
  serialNumber: string | null;
  supplier: string | null;
  inStock: number | null;
  basePrice: number | null;
  createdAt: Date;
};

type MachineType = {
  id: string;
  name: string;
  label: string;
};

interface Props {
  initialProducts: Product[];
  machineTypes: MachineType[];
  userRole: string;
}

export function ProductsClient({ initialProducts, machineTypes, userRole }: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterMachineType, setFilterMachineType] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<ProductInput>({
    sku: "",
    name: "",
    description: "",
    machineTypeId: "",
    location: "",
    image: "",
    serialNumber: "",
    supplier: "",
    inStock: undefined,
    basePrice: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isReadOnly = userRole === "WAREHOUSE_SPECIALIST";

  const handleAdd = async () => {
    if (!formData.sku || !formData.name || !formData.machineTypeId) {
      setError("SKU, Nazwa i Typ automatu są wymagane");
      return;
    }

    setLoading(true);
    const result = await createProduct(formData);
    setLoading(false);

    if (result.success) {
      setProducts([...products, result.data]);
      setFormData({
        sku: "",
        name: "",
        description: "",
        machineTypeId: "",
        location: "",
        image: "",
        serialNumber: "",
        supplier: "",
        inStock: undefined,
        basePrice: undefined,
      });
      setIsAdding(false);
      setError("");
    } else {
      setError(result.error);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!formData.sku || !formData.name || !formData.machineTypeId) {
      setError("SKU, Nazwa i Typ automatu są wymagane");
      return;
    }

    setLoading(true);
    const result = await updateProduct(id, formData);
    setLoading(false);

    if (result.success) {
      setProducts(products.map((p) => (p.id === id ? result.data : p)));
      setEditingId(null);
      setFormData({
        sku: "",
        name: "",
        description: "",
        machineTypeId: "",
        location: "",
        image: "",
        serialNumber: "",
        supplier: "",
        inStock: undefined,
        basePrice: undefined,
      });
      setError("");
    } else {
      setError(result.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Czy na pewno chcesz usunąć ten produkt?")) return;

    setLoading(true);
    const result = await deleteProduct(id);
    setLoading(false);

    if (result.success) {
      setProducts(products.filter((p) => p.id !== id));
      setError("");
    } else {
      setError(result.error);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (filterMachineType && p.machineTypeId !== filterMachineType) return false;
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase()) && !p.sku.includes(searchTerm)) {
      return false;
    }
    return true;
  });

  return (
    <div style={{ marginTop: 32 }}>
      {/* Filters */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div className="field" style={{ flex: 1, minWidth: 200 }}>
          <label style={{ fontSize: 12, color: "var(--ink-3)" }}>Wyszukaj</label>
          <input
            className="input"
            placeholder="SKU lub nazwa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="field" style={{ flex: 1, minWidth: 200 }}>
          <label style={{ fontSize: 12, color: "var(--ink-3)" }}>Filtruj po typie</label>
          <select
            className="input"
            value={filterMachineType}
            onChange={(e) => setFilterMachineType(e.target.value)}
            style={{ padding: "10px 12px", borderRadius: "var(--r-sm)" }}
          >
            <option value="">Wszystkie typy</option>
            {machineTypes.map((mt) => (
              <option key={mt.id} value={mt.id}>
                {mt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Add button */}
      {!isReadOnly && !isAdding && (
        <button className="btn btn-brand" onClick={() => setIsAdding(true)} style={{ marginBottom: 24 }}>
          <Icon name="plus" size={16} />
          Dodaj produkt
        </button>
      )}

      {/* Add form */}
      {!isReadOnly && isAdding && (
        <div style={{ padding: 24, border: "1px solid var(--ink-2)", borderRadius: "var(--r)", marginBottom: 24 }}>
          <h3>Nowy produkt</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
            <div className="field">
              <label>SKU *</label>
              <input
                className="input"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="00042"
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
                <option value="">Wybierz typ</option>
                {machineTypes.map((mt) => (
                  <option key={mt.id} value={mt.id}>
                    {mt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Nazwa *</label>
              <input
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="np. Zawias dolny drzwi"
              />
            </div>
            <div className="field">
              <label>Lokalizacja w automacie</label>
              <input
                className="input"
                value={formData.location || ""}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="np. Lewa strona"
              />
            </div>
            <div className="field">
              <label>Dostawca</label>
              <input
                className="input"
                value={formData.supplier || ""}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Cena bazowa</label>
              <input
                className="input"
                type="number"
                value={formData.basePrice || ""}
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value ? parseFloat(e.target.value) : undefined })}
              />
            </div>
          </div>
          <div className="field" style={{ marginTop: 16 }}>
            <label>Opis</label>
            <textarea
              className="input"
              style={{ minHeight: 80, fontFamily: "monospace" }}
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          {error && <div style={{ color: "var(--danger)", marginTop: 12, fontSize: 14 }}>{error}</div>}
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <button className="btn btn-brand" onClick={handleAdd} disabled={loading}>
              {loading ? "Dodawanie..." : "Dodaj"}
            </button>
            <button
              className="btn"
              onClick={() => {
                setIsAdding(false);
                setFormData({
                  sku: "",
                  name: "",
                  description: "",
                  machineTypeId: "",
                  location: "",
                  image: "",
                  serialNumber: "",
                  supplier: "",
                  inStock: undefined,
                  basePrice: undefined,
                });
                setError("");
              }}
            >
              Anuluj
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div style={{ display: "grid", gap: 12 }}>
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: "center", padding: 32, color: "var(--ink-3)" }}>
            Brak produktów. {!isReadOnly && "Dodaj pierwszy!"}
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              style={{
                padding: 16,
                border: "1px solid var(--ink-2)",
                borderRadius: "var(--r-sm)",
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 16,
                alignItems: "start",
              }}
            >
              {editingId === product.id && !isReadOnly ? (
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div className="field">
                      <label style={{ fontSize: 12 }}>SKU</label>
                      <input
                        className="input"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      />
                    </div>
                    <div className="field">
                      <label style={{ fontSize: 12 }}>Typ</label>
                      <select
                        className="input"
                        value={formData.machineTypeId}
                        onChange={(e) => setFormData({ ...formData, machineTypeId: e.target.value })}
                        style={{ padding: "8px" }}
                      >
                        {machineTypes.map((mt) => (
                          <option key={mt.id} value={mt.id}>
                            {mt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label style={{ fontSize: 12 }}>Nazwa</label>
                      <input
                        className="input"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="field">
                      <label style={{ fontSize: 12 }}>Cena</label>
                      <input
                        className="input"
                        type="number"
                        value={formData.basePrice || ""}
                        onChange={(e) => setFormData({ ...formData, basePrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                      />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                    <button className="btn btn-sm btn-brand" onClick={() => handleUpdate(product.id)} disabled={loading}>
                      {loading ? "..." : "Zapisz"}
                    </button>
                    <button className="btn btn-sm" onClick={() => setEditingId(null)}>
                      Anuluj
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <strong style={{ fontSize: 16 }}>{product.sku}</strong>
                      <span style={{ fontSize: 12, padding: "4px 8px", background: "var(--surface-2)", borderRadius: "var(--r-sm)", color: "var(--ink-3)" }}>
                        {machineTypes.find((mt) => mt.id === product.machineTypeId)?.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, marginTop: 4, fontWeight: 500 }}>{product.name}</div>
                    {product.description && <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 6 }}>{product.description.substring(0, 80)}</div>}
                    {product.basePrice && <div style={{ fontSize: 12, color: "var(--brand)", marginTop: 4, fontWeight: 500 }}>Cena: {product.basePrice.toFixed(2)} zł</div>}
                  </div>
                  {!isReadOnly && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="btn btn-sm"
                        onClick={() => {
                          setEditingId(product.id);
                          setFormData({
                            sku: product.sku,
                            name: product.name,
                            description: product.description || "",
                            machineTypeId: product.machineTypeId,
                            location: product.location || "",
                            image: product.image || "",
                            serialNumber: product.serialNumber || "",
                            supplier: product.supplier || "",
                            inStock: product.inStock || undefined,
                            basePrice: product.basePrice ? parseFloat(product.basePrice.toString()) : undefined,
                          });
                        }}
                      >
                        <Icon name="edit" size={14} />
                      </button>
                      <button className="btn btn-sm" style={{ color: "var(--danger)" }} onClick={() => handleDelete(product.id)}>
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: 32, fontSize: 12, color: "var(--ink-3)" }}>
        Pokazano {filteredProducts.length} z {products.length} produktów
      </div>
    </div>
  );
}
