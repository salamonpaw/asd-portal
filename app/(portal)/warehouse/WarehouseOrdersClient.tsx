"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { updateServiceOrder } from "@/lib/actions/service-orders";

type ServiceOrder = {
  id: string;
  code: string;
  status: string;
  deliveryAddress: string;
  neededDate: string | null;
  notes: string | null;
  trackingNumber: string | null;
  rejectionReason: string | null;
  items: Array<{
    id: string;
    quantity: number;
    price: number | null;
    fulfilledQuantity: number | null;
    product: { sku: string; name: string };
  }>;
  technician: { name: string; email: string };
  partner: { name: string };
  warehouseSpecialist: { name: string } | null;
  createdAt: Date;
};

interface Props {
  initialOrders: ServiceOrder[];
}

export function WarehouseOrdersClient({ initialOrders }: Props) {
  const [orders, setOrders] = useState(initialOrders);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [formData, setFormData] = useState({
    trackingNumber: "",
    rejectionReason: "",
    prices: {} as Record<string, string>,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const statuses = ["NOWE", "PRZYJĘTE", "CZĘŚCIOWO_ZREALIZOWANE", "ZREALIZOWANE", "ODRZUCONE", "ZAWIESZONE"];
  const statusColors: Record<string, string> = {
    NOWE: "var(--brand)",
    PRZYJĘTE: "var(--success)",
    CZĘŚCIOWO_ZREALIZOWANE: "var(--warning)",
    ZREALIZOWANE: "var(--success)",
    ODRZUCONE: "var(--danger)",
    ZAWIESZONE: "var(--warning)",
  };

  const filteredOrders = orders.filter((o) => !filterStatus || o.status === filterStatus);

  const handleApprove = async (orderId: string) => {
    setLoading(true);
    setError("");
    const result = await updateServiceOrder(orderId, { status: "PRZYJĘTE" });
    setLoading(false);

    if (result.success) {
      window.location.reload();
    } else {
      setError(result.error);
    }
  };

  const handleReject = async (orderId: string) => {
    if (!formData.rejectionReason) {
      setError("Podaj powód odrzucenia");
      return;
    }
    setLoading(true);
    const result = await updateServiceOrder(orderId, {
      status: "ODRZUCONE",
      rejectionReason: formData.rejectionReason,
    });
    setLoading(false);

    if (result.success) {
      window.location.reload();
    } else {
      setError(result.error);
    }
  };

  const handleSuspend = async (orderId: string) => {
    setLoading(true);
    const result = await updateServiceOrder(orderId, { status: "ZAWIESZONE" });
    setLoading(false);

    if (result.success) {
      window.location.reload();
    } else {
      setError(result.error);
    }
  };

  return (
    <div style={{ marginTop: 32 }}>
      {/* Filters */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 12, color: "var(--ink-3)" }}>Filtruj po statusie</label>
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          <button
            className={`btn btn-sm ${!filterStatus ? "btn-brand" : ""}`}
            onClick={() => setFilterStatus("")}
            style={{ opacity: !filterStatus ? 1 : 0.6 }}
          >
            Wszystkie ({orders.length})
          </button>
          {statuses.map((status) => {
            const count = orders.filter((o) => o.status === status).length;
            return (
              <button
                key={status}
                className={`btn btn-sm ${filterStatus === status ? "btn-brand" : ""}`}
                onClick={() => setFilterStatus(status)}
                style={{ opacity: filterStatus === status ? 1 : 0.6 }}
              >
                {status} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders list */}
      <div style={{ display: "grid", gap: 16 }}>
        {filteredOrders.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--ink-3)" }}>
            Brak zamówień
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              style={{
                border: `1px solid ${statusColors[order.status]}33`,
                borderRadius: "var(--r)",
                overflow: "hidden",
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: 16,
                  background: `${statusColors[order.status]}11`,
                  borderBottom: `1px solid ${statusColors[order.status]}33`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                }}
                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{order.code}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>
                    {order.partner.name} • {new Date(order.createdAt).toLocaleDateString("pl")}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span
                    style={{
                      fontSize: 11,
                      padding: "4px 8px",
                      borderRadius: "var(--r-sm)",
                      background: `${statusColors[order.status]}22`,
                      color: statusColors[order.status],
                      fontWeight: 500,
                    }}
                  >
                    {order.status}
                  </span>
                  <Icon name={expandedId === order.id ? "chevronUp" : "chevronDown"} size={18} />
                </div>
              </div>

              {/* Expanded content */}
              {expandedId === order.id && (
                <div style={{ padding: 16, borderTop: `1px solid ${statusColors[order.status]}33` }}>
                  {/* Order details */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 4 }}>Adres dostawy</div>
                      <div style={{ fontSize: 13 }}>{order.deliveryAddress}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 4 }}>Data potrzeby</div>
                      <div style={{ fontSize: 13 }}>{order.neededDate ? new Date(order.neededDate).toLocaleDateString("pl") : "—"}</div>
                    </div>
                  </div>

                  {/* Items table */}
                  <div style={{ marginBottom: 16, fontSize: 12 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Części ({order.items.length})</div>
                    <div style={{ display: "grid", gap: 8 }}>
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            padding: 8,
                            background: "var(--surface-2)",
                            borderRadius: "var(--r-sm)",
                            display: "grid",
                            gridTemplateColumns: "auto 1fr auto auto",
                            gap: 12,
                            alignItems: "center",
                          }}
                        >
                          <div style={{ fontWeight: 500 }}>{item.product.sku}</div>
                          <div>{item.product.name.substring(0, 40)}</div>
                          <div style={{ textAlign: "center", fontWeight: 500 }}>×{item.quantity}</div>
                          <input
                            type="number"
                            placeholder="Cena"
                            value={formData.prices[item.id] || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                prices: { ...formData.prices, [item.id]: e.target.value },
                              })
                            }
                            style={{
                              width: 70,
                              padding: "4px 6px",
                              border: "1px solid var(--ink-2)",
                              borderRadius: "var(--r-sm)",
                              fontSize: 11,
                            }}
                            disabled={editingId !== order.id}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action buttons */}
                  {editingId === order.id ? (
                    <div style={{ display: "grid", gap: 12 }}>
                      {/* Tracking number */}
                      <div className="field">
                        <label style={{ fontSize: 12 }}>Numer śledzenia</label>
                        <input
                          className="input"
                          value={formData.trackingNumber}
                          onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                          placeholder="np. DHL123456789"
                        />
                      </div>

                      {/* Rejection reason */}
                      <div className="field">
                        <label style={{ fontSize: 12 }}>Powód odrzucenia (jeśli dotyczy)</label>
                        <select
                          className="input"
                          value={formData.rejectionReason}
                          onChange={(e) => setFormData({ ...formData, rejectionReason: e.target.value })}
                          style={{ padding: "8px 12px" }}
                        >
                          <option value="">— wybierz —</option>
                          <option value="nieaktualne">Nieaktualne</option>
                          <option value="brak-plyatnosci">Brak płatności</option>
                          <option value="duplikat">Duplikat</option>
                          <option value="inne">Inne</option>
                        </select>
                      </div>

                      {error && <div style={{ color: "var(--danger)", fontSize: 12 }}>{error}</div>}

                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-sm btn-brand" onClick={() => handleApprove(order.id)} disabled={loading}>
                          Zatwierdź
                        </button>
                        <button className="btn btn-sm" onClick={() => handleSuspend(order.id)} disabled={loading}>
                          Zawieś
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ color: "var(--danger)" }}
                          onClick={() => handleReject(order.id)}
                          disabled={loading}
                        >
                          Odrzuć
                        </button>
                        <button
                          className="btn btn-sm"
                          onClick={() => {
                            setEditingId(null);
                            setFormData({ trackingNumber: "", rejectionReason: "", prices: {} });
                          }}
                        >
                          Anuluj
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button className="btn btn-sm" onClick={() => setEditingId(order.id)}>
                      Zarządzaj
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
