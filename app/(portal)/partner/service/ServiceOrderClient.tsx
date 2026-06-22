"use client";

import { useState } from "react";
import { Icon, EmptyState } from "@/components/ui";
import { createServiceOrder } from "@/lib/actions/service-orders";

type Product = {
  id: string;
  sku: string;
  name: string;
  machineTypeId: string;
  machineType: { id: string; name: string; label: string };
  location: string | null;
  image: string | null;
  sellingPrice: number | null;
};

type MachineType = {
  id: string;
  name: string;
  label: string;
};

type ServiceOrder = {
  id: string;
  code: string;
  status: string;
  deliveryAddress: string;
  neededDate: string | null;
  notes: string | null;
  items: Array<{
    id: string;
    product: Product;
    quantity: number;
    unitPrice: number | null;
    discountType: string | null;
    discountValue: number | null;
    fulfilledQuantity: number | null;
  }>;
  warehouseSpecialist: { name: string } | null;
  createdAt: Date;
};

interface Props {
  products: Product[];
  machineTypes: MachineType[];
  initialOrders: ServiceOrder[];
  userEmail: string;
}

export function ServiceOrderClient({ products, machineTypes, initialOrders, userEmail }: Props) {
  const [orders, setOrders] = useState(initialOrders);
  const [isCreating, setIsCreating] = useState(false);
  const [filterMachineType, setFilterMachineType] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<Array<{ productId: string; quantity: number }>>([]);
  const [formData, setFormData] = useState({
    deliveryAddress: "",
    neededDate: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredProducts = products.filter((p) => {
    if (filterMachineType && p.machineTypeId !== filterMachineType) return false;
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase()) && !p.sku.includes(searchTerm)) {
      return false;
    }
    return true;
  });

  const calculateFinalPrice = (unitPrice: number, discountType: string | null, discountValue: number | null, quantity: number) => {
    let finalPrice = unitPrice * quantity;
    if (discountType === "PERCENT" && discountValue && discountValue > 0) {
      finalPrice = finalPrice * (1 - discountValue / 100);
    } else if (discountType === "AMOUNT" && discountValue && discountValue > 0) {
      finalPrice = finalPrice - discountValue;
    }
    return Math.max(0, finalPrice);
  };

  const calculateOrderTotal = (order: ServiceOrder) => {
    return order.items.reduce((sum, item) => {
      if (item.unitPrice) {
        const finalPrice = calculateFinalPrice(
          item.unitPrice as any,
          item.discountType,
          item.discountValue as any,
          item.quantity
        );
        return sum + finalPrice;
      }
      return sum;
    }, 0);
  };

  const isOrderPriced = (order: ServiceOrder) => {
    return order.items.every((item) => item.unitPrice !== null && item.unitPrice !== undefined);
  };

  const cartTotal = cart.length;
  const addToCart = (productId: string) => {
    const existing = cart.find((c) => c.productId === productId);
    if (existing) {
      setCart(cart.map((c) => (c.productId === productId ? { ...c, quantity: c.quantity + 1 } : c)));
    } else {
      setCart([...cart, { productId, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((c) => c.productId !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map((c) => (c.productId === productId ? { ...c, quantity } : c)));
    }
  };

  const handleCreateOrder = async () => {
    if (!formData.deliveryAddress || cart.length === 0) {
      setError("Uzupełnij adres dostawy i wybierz co najmniej jedną część");
      return;
    }

    setLoading(true);
    setError("");

    const result = await createServiceOrder(
      "",
      "",
      cart,
      formData.deliveryAddress,
      formData.neededDate || undefined,
      formData.notes || undefined
    );

    setLoading(false);

    if (result.success) {
      // Refresh orders list
      window.location.reload();
    } else {
      setError(result.error);
    }
  };

  return (
    <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "1fr 350px", gap: 24 }}>
      {/* Main content */}
      <div>
        {/* Create new order */}
        {!isCreating && (
          <button className="btn btn-brand" onClick={() => setIsCreating(true)} style={{ marginBottom: 24 }}>
            <Icon name="plus" size={16} />
            Nowe zamówienie
          </button>
        )}

        {isCreating && (
          <div style={{ padding: 24, border: "1px solid var(--ink-2)", borderRadius: "var(--r)", marginBottom: 24 }}>
            <h3>Nowe zamówienie serwisowe</h3>

            {/* Filters */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
              <div className="field">
                <label style={{ fontSize: 12 }}>Wyszukaj</label>
                <input
                  className="input"
                  placeholder="SKU lub nazwa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="field">
                <label style={{ fontSize: 12 }}>Typ automatu</label>
                <select
                  className="input"
                  value={filterMachineType}
                  onChange={(e) => setFilterMachineType(e.target.value)}
                  style={{ padding: "10px 12px" }}
                >
                  <option value="">Wszystkie</option>
                  {machineTypes.map((mt) => (
                    <option key={mt.id} value={mt.id}>
                      {mt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Products grid */}
            <div style={{ marginTop: 16, maxHeight: 400, overflowY: "auto" }}>
              <div style={{ display: "grid", gap: 8 }}>
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    style={{
                      padding: 12,
                      border: "1px solid var(--ink-2)",
                      borderRadius: "var(--r-sm)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: 13 }}>{product.sku}</strong>
                      <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{product.name}</div>
                    </div>
                    <button
                      className="btn btn-sm btn-brand"
                      onClick={() => addToCart(product.id)}
                      style={{ whiteSpace: "nowrap" }}
                    >
                      <Icon name="plus" size={14} />
                      Dodaj
                    </button>
                  </div>
                ))}
              </div>
              {filteredProducts.length === 0 && (
                <div style={{ padding: 16 }}>
                  <EmptyState
                    title="Brak wyników"
                    sub="Nie znaleźliśmy produktów spełniających twoje kryteria"
                    icon="search"
                  />
                </div>
              )}
            </div>

            {/* Delivery info */}
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--ink-2)" }}>
              <h4 style={{ marginBottom: 12 }}>Dane dostawy</h4>
              <div className="field">
                <label>Adres dostawy *</label>
                <input
                  className="input"
                  value={formData.deliveryAddress}
                  onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                  placeholder="np. ul. Główna 10, 80-000 Gdańsk"
                />
              </div>
              <div className="field" style={{ marginTop: 12 }}>
                <label>Data potrzeby</label>
                <input
                  className="input"
                  type="date"
                  value={formData.neededDate}
                  onChange={(e) => setFormData({ ...formData, neededDate: e.target.value })}
                />
              </div>
              <div className="field" style={{ marginTop: 12 }}>
                <label>Notatka</label>
                <textarea
                  className="input"
                  style={{ minHeight: 60 }}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Dodatkowe informacje..."
                />
              </div>

              {error && <div style={{ color: "var(--danger)", marginTop: 12, fontSize: 14 }}>{error}</div>}

              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                <button className="btn btn-brand" onClick={handleCreateOrder} disabled={loading}>
                  {loading ? "Tworzenie..." : "Utwórz zamówienie"}
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    setIsCreating(false);
                    setCart([]);
                    setFormData({ deliveryAddress: "", neededDate: "", notes: "" });
                    setError("");
                  }}
                >
                  Anuluj
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Orders history */}
        <div>
          <h3 style={{ marginBottom: 16 }}>Historia zamówień</h3>
          <div style={{ display: "grid", gap: 12 }}>
            {orders.length === 0 ? (
              <EmptyState
                title="Brak zamówień"
                sub="Zacznij od utworzenia nowego zamówienia, aby dodać je do historii"
                icon="inbox"
              />
            ) : (
              orders.map((order) => {
                const isPriced = isOrderPriced(order);
                const total = calculateOrderTotal(order);
                return (
                  <div
                    key={order.id}
                    style={{
                      padding: 16,
                      border: isPriced ? "2px solid var(--success)" : "1px solid var(--ink-2)",
                      borderRadius: "var(--r-sm)",
                      background: isPriced ? "var(--success-soft)" : "transparent",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <div>
                        <strong style={{ fontSize: 14 }}>{order.code}</strong>
                        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>
                          {new Date(order.createdAt).toLocaleDateString("pl")}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {isPriced && (
                          <span
                            style={{
                              fontSize: 11,
                              padding: "4px 8px",
                              borderRadius: "var(--r-sm)",
                              background: "var(--success)",
                              color: "white",
                              fontWeight: 600,
                            }}
                          >
                            Wycenione
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: 11,
                            padding: "4px 8px",
                            borderRadius: "var(--r-sm)",
                            background:
                              order.status === "NOWE" ? "var(--brand-soft)" : order.status === "ZREALIZOWANE" ? "var(--success-soft)" : "var(--warning-soft)",
                            color:
                              order.status === "NOWE" ? "var(--brand)" : order.status === "ZREALIZOWANE" ? "var(--success)" : "var(--warning)",
                          }}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>
                    <div style={{ marginTop: 12, fontSize: 12 }}>
                      <div>
                        <strong>Adres:</strong> {order.deliveryAddress}
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <strong>Pozycji:</strong> {order.items.length}
                      </div>
                      {isPriced && (
                        <div style={{ marginTop: 4, fontWeight: 600, color: "var(--success)" }}>
                          Razem: {total.toFixed(2)} zł
                        </div>
                      )}
                      {order.warehouseSpecialist && (
                        <div style={{ marginTop: 4, color: "var(--ink-3)" }}>
                          <strong>Magazynier:</strong> {order.warehouseSpecialist.name}
                        </div>
                      )}
                      {!isPriced && (
                        <div style={{ marginTop: 8, fontSize: 11, color: "var(--warning)" }}>
                          ⏳ Oczekuje na wycenę
                        </div>
                      )}
                    </div>
                    {isPriced && (
                      <div style={{ marginTop: 16, padding: 12, background: "rgba(34, 197, 94, 0.05)", border: "1px solid var(--success)33", borderRadius: "var(--r-sm)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                          <span style={{ fontSize: 18 }}>✓</span>
                          <div style={{ fontWeight: 600, color: "var(--success)" }}>Potwierdzenie wyceny</div>
                        </div>
                        <div style={{ display: "grid", gap: 6, marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid var(--success)22" }}>
                          {order.items.map((item) => {
                            const finalPrice = calculateFinalPrice(
                              item.unitPrice as any,
                              item.discountType,
                              item.discountValue as any,
                              item.quantity
                            );
                            const hasDiscount = item.discountType && item.discountValue && item.discountValue > 0;
                            return (
                              <div key={item.id} style={{ display: "grid", gap: 2, fontSize: 11 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <div style={{ color: "var(--ink-3)" }}>
                                    {item.product.sku} × {item.quantity}
                                  </div>
                                  <div style={{ fontWeight: 500 }}>
                                    {((item.unitPrice as any) * item.quantity).toFixed(2)} zł
                                  </div>
                                </div>
                                {hasDiscount && (
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--warning)", fontSize: 10 }}>
                                    <div>
                                      Rabat: {item.discountType === "PERCENT" ? `${item.discountValue}%` : `${item.discountValue} zł`}
                                    </div>
                                    <div style={{ fontWeight: 600, color: "var(--success)" }}>
                                      {finalPrice.toFixed(2)} zł
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ fontWeight: 600, fontSize: 12 }}>Razem do zapłaty:</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--success)" }}>
                            {total.toFixed(2)} zł
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Right sidebar — Cart */}
      <div style={{ position: "sticky", top: 32, height: "fit-content" }}>
        <div style={{ padding: 16, background: "var(--surface-2)", borderRadius: "var(--r)", border: "1px solid var(--ink-2)" }}>
          <h4 style={{ marginBottom: 12 }}>
            Koszyk ({cartTotal})
          </h4>

          <div style={{ display: "grid", gap: 8, maxHeight: 400, overflowY: "auto", marginBottom: 16 }}>
            {cart.length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--ink-3)", textAlign: "center", padding: 16 }}>
                Puste
              </div>
            ) : (
              cart.map((item) => {
                const product = products.find((p) => p.id === item.productId);
                if (!product) return null;
                return (
                  <div
                    key={item.productId}
                    style={{
                      padding: 8,
                      background: "var(--paper)",
                      borderRadius: "var(--r-sm)",
                      fontSize: 12,
                    }}
                  >
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>{product.sku}</div>
                    <div style={{ color: "var(--ink-3)", fontSize: 11, marginBottom: 6 }}>
                      {product.name.substring(0, 30)} × {item.quantity}
                    </div>
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <button
                        className="btn btn-xs"
                        onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                        style={{ flex: 1 }}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateCartQuantity(item.productId, parseInt(e.target.value) || 1)}
                        style={{
                          width: 40,
                          padding: "4px 6px",
                          border: "1px solid var(--ink-2)",
                          borderRadius: "var(--r-sm)",
                          textAlign: "center",
                          fontSize: 11,
                        }}
                      />
                      <button
                        className="btn btn-xs"
                        onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                        style={{ flex: 1 }}
                      >
                        +
                      </button>
                      <button
                        className="btn btn-xs"
                        onClick={() => removeFromCart(item.productId)}
                        style={{ color: "var(--danger)" }}
                      >
                        <Icon name="trash" size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {cart.length > 0 && (
            <button
              className="btn btn-brand"
              style={{ width: "100%", marginTop: 8 }}
              onClick={() => {
                const cartElement = document.querySelector("[data-cart-ready]");
                if (cartElement) cartElement.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
            >
              Przejdź do formularza
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
