"use client";

import { useState } from "react";
import { createMachineType, updateMachineType, deleteMachineType } from "@/lib/actions/machine-types";
import { Icon } from "@/components/ui/Icon";

type MachineType = {
  id: string;
  name: string;
  label: string;
  createdAt: Date;
};

interface Props {
  initialMachineTypes: MachineType[];
}

export function MachineTypesClient({ initialMachineTypes }: Props) {
  const [machineTypes, setMachineTypes] = useState(initialMachineTypes);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", label: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = async () => {
    if (!formData.name || !formData.label) {
      setError("Wypełnij wszystkie pola");
      return;
    }

    setLoading(true);
    const result = await createMachineType(formData.name, formData.label);
    setLoading(false);

    if (result.success) {
      setMachineTypes([...machineTypes, result.data as MachineType]);
      setFormData({ name: "", label: "" });
      setIsAdding(false);
      setError("");
    } else {
      setError(result.error || "");
    }
  };

  const handleUpdate = async (id: string) => {
    if (!formData.name || !formData.label) {
      setError("Wypełnij wszystkie pola");
      return;
    }

    setLoading(true);
    const result = await updateMachineType(id, formData.name, formData.label);
    setLoading(false);

    if (result.success) {
      setMachineTypes(machineTypes.map((mt) => (mt.id === id ? (result.data as MachineType) : mt)));
      setEditingId(null);
      setFormData({ name: "", label: "" });
      setError("");
    } else {
      setError(result.error || "");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Czy na pewno chcesz usunąć ten typ automatu?")) return;

    setLoading(true);
    const result = await deleteMachineType(id);
    setLoading(false);

    if (result.success) {
      setMachineTypes(machineTypes.filter((mt) => mt.id !== id));
      setError("");
    } else {
      setError(result.error || "");
    }
  };

  return (
    <div style={{ marginTop: 32 }}>
      {/* Add form */}
      {!isAdding && (
        <button className="btn btn-brand" onClick={() => setIsAdding(true)} style={{ marginBottom: 24 }}>
          <Icon name="plus" size={16} />
          Dodaj typ automatu
        </button>
      )}

      {isAdding && (
        <div style={{ padding: 24, border: "1px solid var(--ink-2)", borderRadius: "var(--r)", marginBottom: 24 }}>
          <h3>Nowy typ automatu</h3>
          <div className="field" style={{ marginTop: 16 }}>
            <label>Nazwa (unique)</label>
            <input
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="np. BĘBNOWY"
            />
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label>Etykieta (label)</label>
            <input
              className="input"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="np. Automat Bębnowy"
            />
          </div>
          {error && <div style={{ color: "var(--danger)", marginTop: 12, fontSize: 14 }}>{error}</div>}
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <button
              className="btn btn-brand"
              onClick={handleAdd}
              disabled={loading}
            >
              {loading ? "Dodawanie..." : "Dodaj"}
            </button>
            <button
              className="btn"
              onClick={() => {
                setIsAdding(false);
                setFormData({ name: "", label: "" });
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
        {machineTypes.map((mt) => (
          <div
            key={mt.id}
            style={{
              padding: 16,
              border: "1px solid var(--ink-2)",
              borderRadius: "var(--r-sm)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {editingId === mt.id ? (
              <div style={{ flex: 1 }}>
                <div className="field" style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12 }}>Nazwa</label>
                  <input
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label style={{ fontSize: 12 }}>Etykieta</label>
                  <input
                    className="input"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  />
                </div>
              </div>
            ) : (
              <div>
                <strong>{mt.name}</strong>
                <div style={{ fontSize: 14, color: "var(--ink-3)", marginTop: 4 }}>{mt.label}</div>
              </div>
            )}

            <div style={{ display: "flex", gap: 12 }}>
              {editingId === mt.id ? (
                <>
                  <button
                    className="btn btn-sm btn-brand"
                    onClick={() => handleUpdate(mt.id)}
                    disabled={loading}
                  >
                    {loading ? "..." : "Zapisz"}
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={() => {
                      setEditingId(null);
                      setFormData({ name: "", label: "" });
                    }}
                  >
                    Anuluj
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn btn-sm"
                    onClick={() => {
                      setEditingId(mt.id);
                      setFormData({ name: mt.name, label: mt.label });
                    }}
                  >
                    <Icon name="edit" size={14} />
                  </button>
                  <button
                    className="btn btn-sm"
                    style={{ color: "var(--danger)" }}
                    onClick={() => handleDelete(mt.id)}
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {machineTypes.length === 0 && !isAdding && (
        <div style={{ textAlign: "center", padding: 32, color: "var(--ink-3)" }}>
          Brak typów automatów. Dodaj pierwszy!
        </div>
      )}
    </div>
  );
}
