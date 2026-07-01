"use client";

import { useState } from "react";
import { createServiceOrder } from "@/lib/actions/service-orders";

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  image: string;
  warehouseStock: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface OrderFormClientProps {
  products: Product[];
}

export function OrderFormClient({ products }: OrderFormClientProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    deliveryAddress: "",
    notes: "",
    neededDate: "",
  });

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product, quantity: number = 1) => {
    setError("");
    if (quantity < 1 || quantity > product.warehouseStock) {
      setError(`Ilość musi być od 1 do ${product.warehouseStock}`);
      return;
    }

    const existingItem = cart.find((item) => item.product.id === product.id);
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.warehouseStock) {
        setError(`Maksymalnie ${product.warehouseStock} sztuk dostępne`);
        return;
      }
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    } else {
      setCart([...cart, { product, quantity }]);
    }
    setSuccess(`Dodano ${product.name}`);
    setTimeout(() => setSuccess(""), 2000);
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    const item = cart.find((i) => i.product.id === productId);
    if (item && quantity > item.product.warehouseStock) {
      setError(`Maksymalnie ${item.product.warehouseStock} sztuk dostępne`);
      return;
    }
    setCart(
      cart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!formData.deliveryAddress.trim()) {
      setError("Adres dostawy jest wymagany");
      return;
    }

    if (cart.length === 0) {
      setError("Dodaj co najmniej jeden produkt");
      return;
    }

    setLoading(true);

    try {
      const result = await createServiceOrder(
        "", // partnerId - pobierany z sesji w action
        "", // technicianId - pobierany z sesji w action
        cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        formData.deliveryAddress,
        formData.neededDate || undefined,
        formData.notes || undefined
      );

      if (result.success) {
        setSuccess(`✓ Zamówienie ${result.data?.code} utworzone!`);
        setCart([]);
        setFormData({ deliveryAddress: "", notes: "", neededDate: "" });
        setShowForm(false);
        setTimeout(() => {
          window.location.href = `/service-technician/dashboard`;
        }, 2000);
      } else {
        setError(result.error || "Błąd przy tworzeniu zamówienia");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "1200px" }}>
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
        {/* Products List */}
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            Dostępne części ({filteredProducts.length})
          </h2>

          <input
            type="text"
            placeholder="Szukaj po nazwie lub SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid var(--ink-2)",
              borderRadius: "var(--r-sm)",
              marginBottom: 16,
              fontSize: 13,
            }}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                style={{
                  padding: 12,
                  background: "var(--paper)",
                  border: "1px solid var(--ink-2)",
                  borderRadius: "var(--r-sm)",
                }}
              >
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{product.name}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
                    SKU: {product.sku} • Dostęp: {product.warehouseStock}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="number"
                    min="1"
                    max={product.warehouseStock}
                    defaultValue="1"
                    id={`qty-${product.id}`}
                    style={{
                      width: 60,
                      padding: "6px 8px",
                      border: "1px solid var(--ink-2)",
                      borderRadius: "var(--r-sm)",
                      fontSize: 12,
                    }}
                  />
                  <button
                    onClick={() => {
                      const qty = parseInt(
                        (document.getElementById(`qty-${product.id}`) as HTMLInputElement)?.value || "1"
                      );
                      addToCart(product, qty);
                    }}
                    style={{
                      padding: "6px 12px",
                      background: "var(--brand)",
                      color: "white",
                      border: "none",
                      borderRadius: "var(--r-sm)",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    + Dodaj
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart & Form */}
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            Koszyk ({cart.length} części)
          </h2>

          {cart.length === 0 ? (
            <div
              style={{
                padding: 24,
                textAlign: "center",
                background: "var(--surface-2)",
                borderRadius: "var(--r)",
                color: "var(--ink-3)",
                marginBottom: 16,
              }}
            >
              Koszyk pusty. Dodaj części po lewej.
            </div>
          ) : (
            <div
              style={{
                background: "var(--paper)",
                border: "1px solid var(--ink-2)",
                borderRadius: "var(--r)",
                overflow: "hidden",
                marginBottom: 16,
              }}
            >
              {cart.map((item, idx) => (
                <div
                  key={item.product.id}
                  style={{
                    padding: 12,
                    borderBottom: idx < cart.length - 1 ? "1px solid var(--ink-2)" : "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{item.product.name}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)" }}>SKU: {item.product.sku}</div>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="number"
                      min="1"
                      max={item.product.warehouseStock}
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(item.product.id, parseInt(e.target.value) || 1)
                      }
                      style={{
                        width: 50,
                        padding: "4px 6px",
                        border: "1px solid var(--ink-2)",
                        borderRadius: "var(--r-sm)",
                        fontSize: 12,
                      }}
                    />

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      style={{
                        padding: "4px 8px",
                        background: "var(--danger-soft)",
                        color: "var(--danger)",
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

          {cart.length > 0 && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              style={{
                width: "100%",
                padding: "12px",
                background: "var(--brand)",
                color: "white",
                border: "none",
                borderRadius: "var(--r-sm)",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Dalej — Adres i uwagi
            </button>
          )}

          {showForm && (
            <div
              style={{
                padding: 16,
                background: "var(--paper)",
                border: "1px solid var(--ink-2)",
                borderRadius: "var(--r)",
              }}
            >
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 4, fontSize: 12, fontWeight: 600 }}>
                  Adres dostawy *
                </label>
                <textarea
                  value={formData.deliveryAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, deliveryAddress: e.target.value })
                  }
                  placeholder="np. ul. Kwiatowa 15, 80-001 Gdańsk"
                  style={{
                    width: "100%",
                    minHeight: 80,
                    padding: "8px 12px",
                    border: "1px solid var(--ink-2)",
                    borderRadius: "var(--r-sm)",
                    fontSize: 13,
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 4, fontSize: 12, fontWeight: 600 }}>
                  Data potrzeby (opcjonalnie)
                </label>
                <input
                  type="date"
                  value={formData.neededDate}
                  onChange={(e) =>
                    setFormData({ ...formData, neededDate: e.target.value })
                  }
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
                <label style={{ display: "block", marginBottom: 4, fontSize: 12, fontWeight: 600 }}>
                  Uwagi (opcjonalnie)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="np. Dostarczyć przed godz. 14:00"
                  style={{
                    width: "100%",
                    minHeight: 60,
                    padding: "8px 12px",
                    border: "1px solid var(--ink-2)",
                    borderRadius: "var(--r-sm)",
                    fontSize: 13,
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button
                  onClick={() => setShowForm(false)}
                  disabled={loading}
                  style={{
                    padding: "10px",
                    background: "var(--surface-2)",
                    color: "var(--ink)",
                    border: "none",
                    borderRadius: "var(--r-sm)",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Cofnij
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{
                    padding: "10px",
                    background: "var(--brand)",
                    color: "white",
                    border: "none",
                    borderRadius: "var(--r-sm)",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? "Tworzę..." : "✓ Wyślij zamówienie"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
