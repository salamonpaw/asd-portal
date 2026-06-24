"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { updateBulkInventory, getInventoryHistory } from "@/lib/actions/inventory";

interface InventoryAudit {
  id: string;
  fromStock: number;
  toStock: number;
  changedBy: string;
  notes: string | null;
  createdAt: Date;
}

interface Inventory {
  id: string;
  productId: string;
  currentStock: number;
  product: {
    id: string;
    sku: string;
    name: string;
    inStock: number | null;
  };
  audits: InventoryAudit[];
}

interface InventoryClientProps {
  initialInventory: Inventory[];
}

interface BulkItem {
  inventoryId: string;
  productId: string;
  name: string;
  sku: string;
  fromStock: number;
  toStock: number;
}

export function InventoryClient({ initialInventory }: InventoryClientProps) {
  const [inventory, setInventory] = useState(initialInventory);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [history, setHistory] = useState<Inventory | null>(null);

  // Bulk update state
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [notes, setNotes] = useState("");
  const [bulkItems, setBulkItems] = useState<BulkItem[]>([]);

  const filteredForBulk = inventory.filter((item) =>
    item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product.sku.includes(searchTerm)
  );

  const handleAddToBulk = (item: Inventory) => {
    const existing = bulkItems.find((b) => b.productId === item.productId);
    if (!existing) {
      setBulkItems([...bulkItems, {
        inventoryId: item.id,
        productId: item.productId,
        name: item.product.name,
        sku: item.product.sku,
        fromStock: item.currentStock,
        toStock: item.currentStock,
      }]);
    }
  };

  const handleRemoveFromBulk = (productId: string) => {
    setBulkItems(bulkItems.filter((b) => b.productId !== productId));
  };

  const handleUpdateBulkStock = (productId: string, delta: number) => {
    setBulkItems(
      bulkItems.map((b) =>
        b.productId === productId
          ? { ...b, toStock: Math.max(0, b.toStock + delta) }
          : b
      )
    );
  };

  const handleSaveBulk = async () => {
    if (bulkItems.length === 0) {
      setError("Dodaj co najmniej jeden produkt");
      return;
    }
    if (!notes.trim()) {
      setError("Podaj WZ lub numer dokumentu");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const result = await updateBulkInventory(
      bulkItems.map((b) => ({
        productId: b.productId,
        fromStock: b.fromStock,
        toStock: b.toStock,
      })),
      notes
    );

    setLoading(false);

    if (result.success) {
      setSuccess(`✓ Zaktualizowano ${bulkItems.length} produktów`);
      setBulkItems([]);
      setNotes("");
      setShowBulkForm(false);
      setTimeout(() => setSuccess(""), 3000);
      window.location.reload();
    } else {
      setError(result.error || "Błąd");
    }
  };

  const handleViewHistory = async (productId: string) => {
    const result = await getInventoryHistory(productId);
    if (result.success && result.data) {
      setHistory(result.data);
      setShowHistory(productId);
    }
  };

  if (showHistory && history) {
    return (
      <div>
        <div
          style={{
            background: "var(--paper)",
            border: "1px solid var(--ink-2)",
            borderRadius: "var(--r)",
            padding: 24,
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{history.product.name}</h2>
              <p style={{ fontSize: 12, color: "var(--ink-3)" }}>SKU: {history.product.sku}</p>
            </div>
            <button
              onClick={() => setShowHistory(null)}
              style={{
                padding: "6px 12px",
                background: "var(--ink-2)",
                color: "white",
                border: "none",
                borderRadius: "var(--r-sm)",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Zamknij historię
            </button>
          </div>

          <div style={{ background: "var(--surface-2)", padding: 12, borderRadius: "var(--r-sm)", marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 4 }}>Obecny stan</div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{history.currentStock} szt.</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 4 }}>Ostatnia zmiana</div>
                <div style={{ fontSize: 13, color: "var(--ink-2)" }}>
                  {history.audits[0]
                    ? new Date(history.audits[0].createdAt).toLocaleDateString("pl")
                    : "—"}
                </div>
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Historia zmian ({history.audits.length})</h3>

          {history.audits.length > 0 ? (
            <div style={{ background: "var(--surface-2)", borderRadius: "var(--r-sm)", overflow: "hidden" }}>
              {history.audits.map((audit, idx) => (
                <div
                  key={audit.id}
                  style={{
                    padding: 12,
                    borderBottom: idx < history.audits.length - 1 ? "1px solid var(--ink-2)" : "none",
                    fontSize: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 6 }}>
                    <div style={{ fontWeight: 600 }}>
                      {audit.fromStock} → {audit.toStock} szt.
                    </div>
                    <div style={{ color: "var(--ink-3)" }}>
                      {new Date(audit.createdAt).toLocaleDateString("pl")} {new Date(audit.createdAt).toLocaleTimeString("pl")}
                    </div>
                  </div>
                  <div style={{ color: "var(--ink-3)", marginBottom: 4 }}>Zmienił: {audit.changedBy}</div>
                  {audit.notes && <div style={{ fontStyle: "italic", color: "var(--ink-2)" }}>Notatka: {audit.notes}</div>}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", color: "var(--ink-3)", padding: 16 }}>
              Brak zmian w historii
            </div>
          )}
        </div>
      </div>
    );
  }

  if (showBulkForm) {
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

        <div
          style={{
            background: "var(--paper)",
            border: "1px solid var(--ink-2)",
            borderRadius: "var(--r)",
            padding: 24,
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Uzupełnij magazyn</h2>

          {/* WZ Number */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
              WZ / Numer dokumentu *
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="np. WZ/2026/001"
              style={{
                width: "100%",
                maxWidth: "400px",
                padding: "8px 12px",
                border: "1px solid var(--ink-2)",
                borderRadius: "var(--r-sm)",
                fontSize: 14,
              }}
            />
          </div>

          {/* Search Products */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
              Szukaj produktu
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nazwa lub SKU..."
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid var(--ink-2)",
                borderRadius: "var(--r-sm)",
                fontSize: 14,
              }}
            />
          </div>

          {/* Available Products List */}
          {filteredForBulk.length > 0 ? (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: "var(--ink-3)" }}>
                Dostępne produkty ({filteredForBulk.length})
              </h3>
              <div style={{ background: "var(--surface-2)", borderRadius: "var(--r-sm)", maxHeight: "300px", overflow: "auto" }}>
                {filteredForBulk.map((item, idx) => (
                  <div
                    key={item.productId}
                    style={{
                      padding: 12,
                      borderBottom: idx < filteredForBulk.length - 1 ? "1px solid var(--ink-2)" : "none",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{item.product.name}</div>
                      <div style={{ fontSize: 11, color: "var(--ink-3)" }}>SKU: {item.product.sku}</div>
                    </div>
                    <button
                      onClick={() => handleAddToBulk(item)}
                      disabled={bulkItems.some((b) => b.productId === item.productId)}
                      style={{
                        padding: "4px 12px",
                        background: bulkItems.some((b) => b.productId === item.productId)
                          ? "var(--ink-3)"
                          : "var(--brand)",
                        color: "white",
                        border: "none",
                        borderRadius: "var(--r-sm)",
                        cursor: bulkItems.some((b) => b.productId === item.productId)
                          ? "default"
                          : "pointer",
                        fontSize: 12,
                        opacity: bulkItems.some((b) => b.productId === item.productId) ? 0.6 : 1,
                      }}
                    >
                      {bulkItems.some((b) => b.productId === item.productId) ? "✓ Dodano" : "+ Dodaj"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", color: "var(--ink-3)", padding: 16, marginBottom: 24 }}>
              Brak produktów
            </div>
          )}

          {/* Selected Items */}
          {bulkItems.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: "var(--brand)" }}>
                Do zapisania: {bulkItems.length} produktów
              </h3>
              <div style={{ background: "var(--surface-2)", borderRadius: "var(--r-sm)" }}>
                {bulkItems.map((item, idx) => (
                  <div
                    key={item.productId}
                    style={{
                      padding: 16,
                      borderBottom: idx < bulkItems.length - 1 ? "1px solid var(--ink-2)" : "none",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: "var(--ink-3)" }}>SKU: {item.sku}</div>
                      </div>
                      <button
                        onClick={() => handleRemoveFromBulk(item.productId)}
                        style={{
                          padding: "4px 8px",
                          background: "var(--danger)",
                          color: "white",
                          border: "none",
                          borderRadius: "var(--r-sm)",
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        Usuń
                      </button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 4 }}>Było</div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{item.fromStock} szt.</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 4 }}>Będzie</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <button
                            onClick={() => handleUpdateBulkStock(item.productId, -1)}
                            style={{
                              width: "28px",
                              height: "28px",
                              border: "1px solid var(--ink-2)",
                              background: "var(--paper)",
                              cursor: "pointer",
                              borderRadius: "var(--r-sm)",
                            }}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={item.toStock}
                            onChange={(e) =>
                              setBulkItems(
                                bulkItems.map((b) =>
                                  b.productId === item.productId
                                    ? { ...b, toStock: parseInt(e.target.value) || 0 }
                                    : b
                                )
                              )
                            }
                            style={{
                              width: "60px",
                              padding: "4px 8px",
                              border: "1px solid var(--ink-2)",
                              borderRadius: "var(--r-sm)",
                              textAlign: "center",
                              fontWeight: 600,
                            }}
                          />
                          <button
                            onClick={() => handleUpdateBulkStock(item.productId, 1)}
                            style={{
                              width: "28px",
                              height: "28px",
                              border: "1px solid var(--ink-2)",
                              background: "var(--paper)",
                              cursor: "pointer",
                              borderRadius: "var(--r-sm)",
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 4 }}>Zmiana</div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: item.toStock > item.fromStock ? "var(--success)" : item.toStock < item.fromStock ? "var(--warn)" : "var(--ink-2)",
                          }}
                        >
                          {item.toStock > item.fromStock ? "+" : ""}{item.toStock - item.fromStock} szt.
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleSaveBulk}
              disabled={loading || bulkItems.length === 0}
              style={{
                padding: "8px 16px",
                background: "var(--brand)",
                color: "white",
                border: "none",
                borderRadius: "var(--r-sm)",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 13,
                fontWeight: 600,
                opacity: loading || bulkItems.length === 0 ? 0.6 : 1,
              }}
            >
              {loading ? "Zapisuję..." : `Zapisz ${bulkItems.length} zmian`}
            </button>
            <button
              onClick={() => {
                setShowBulkForm(false);
                setBulkItems([]);
                setNotes("");
                setSearchTerm("");
              }}
              style={{
                padding: "8px 16px",
                background: "var(--ink-2)",
                color: "white",
                border: "none",
                borderRadius: "var(--r-sm)",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Anuluj
            </button>
          </div>
        </div>
      </div>
    );
  }

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

      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => setShowBulkForm(true)}
          style={{
            padding: "10px 16px",
            background: "var(--brand)",
            color: "white",
            border: "none",
            borderRadius: "var(--r-sm)",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          + Uzupełnij magazyn
        </button>
      </div>

      {/* Summary Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "var(--paper)", border: "1px solid var(--ink-2)", borderRadius: "var(--r)", padding: 16 }}>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 4 }}>Produktów w magazynie</div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>{inventory.length}</div>
        </div>
        <div style={{ background: "var(--paper)", border: "1px solid var(--ink-2)", borderRadius: "var(--r)", padding: 16 }}>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 4 }}>Razem na stanie</div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>
            {inventory.reduce((sum, i) => sum + i.currentStock, 0)} szt.
          </div>
        </div>
      </div>

      {/* Inventory List */}
      <div style={{ background: "var(--paper)", border: "1px solid var(--ink-2)", borderRadius: "var(--r)", overflow: "hidden" }}>
        {inventory.length > 0 ? (
          inventory.map((item, idx) => (
            <div
              key={item.productId}
              style={{
                padding: 16,
                borderBottom: idx < inventory.length - 1 ? "1px solid var(--ink-2)" : "none",
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr auto auto",
                gap: 16,
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.product.name}</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)" }}>SKU: {item.product.sku}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 2 }}>Stan magazynu</div>
                <div style={{ fontWeight: 600 }}>{item.currentStock} szt.</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 2 }}>W systemie</div>
                <div style={{ fontWeight: 600 }}>{item.product.inStock || 0} szt.</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 2 }}>Różnica</div>
                <div
                  style={{
                    fontWeight: 600,
                    color: item.currentStock !== (item.product.inStock || 0) ? "var(--warn)" : "var(--success)",
                  }}
                >
                  {(item.currentStock || 0) - (item.product.inStock || 0)}
                </div>
              </div>
              <button
                onClick={() => handleViewHistory(item.productId)}
                style={{
                  padding: "4px 8px",
                  background: "var(--ink-2)",
                  color: "white",
                  border: "none",
                  borderRadius: "var(--r-sm)",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                Historia
              </button>
            </div>
          ))
        ) : (
          <div
            style={{
              padding: 32,
              textAlign: "center",
              color: "var(--ink-3)",
            }}
          >
            Brak produktów
          </div>
        )}
      </div>
    </div>
  );
}
