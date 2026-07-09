"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { createMaterialLink, toggleMaterialActive, deleteMaterial, setMaterialAccess } from "@/lib/actions/marketing";

type Material = {
  id: string;
  filename: string;
  url: string;
  type: string;
  isActive: boolean;
  fileSize: number | null;
  createdAt: string;
  partnerIds: string[];
};

type Partner = { id: string; name: string };

const TYPES = ["CATALOG", "DATASHEET", "BROCHURE", "VIDEO", "OTHER"];
const TYPE_LABELS: Record<string, string> = {
  CATALOG: "Katalog", DATASHEET: "Karta produktu", BROCHURE: "Broszura", VIDEO: "Wideo", OTHER: "Inne",
};

function fmtSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function MarketingMaterialsClient({ initialMaterials, partners }: { initialMaterials: Material[]; partners: Partner[] }) {
  const router = useRouter();
  const [materials, setMaterials] = useState(initialMaterials);
  const [mode, setMode] = useState<"file" | "link">("file");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form state
  const [name, setName] = useState("");
  const [type, setType] = useState("CATALOG");
  const [file, setFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState("");

  // access editor
  const [accessFor, setAccessFor] = useState<string | null>(null);
  const [accessSel, setAccessSel] = useState<Set<string>>(new Set());

  function refresh() { router.refresh(); }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "file") {
        if (!file) { setError("Wybierz plik"); setBusy(false); return; }
        const fd = new FormData();
        fd.append("file", file);
        fd.append("filename", name || file.name);
        fd.append("type", type);
        const res = await fetch("/api/upload/marketing", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Błąd uploadu"); setBusy(false); return; }
        setMaterials((prev) => [{
          id: data.material.id, filename: data.material.filename, url: data.material.url,
          type: data.material.type, isActive: data.material.isActive, fileSize: data.material.fileSize,
          createdAt: data.material.createdAt, partnerIds: [],
        }, ...prev]);
      } else {
        if (!name || !linkUrl) { setError("Nazwa i link są wymagane"); setBusy(false); return; }
        const res = await createMaterialLink({ filename: name, url: linkUrl, type });
        if (!res.success || !res.data) { setError(res.error || "Błąd"); setBusy(false); return; }
        setMaterials((prev) => [{
          id: res.data.id, filename: res.data.filename, url: res.data.url, type: res.data.type,
          isActive: res.data.isActive, fileSize: res.data.fileSize, createdAt: (res.data.createdAt as unknown as Date).toString(), partnerIds: [],
        }, ...prev]);
      }
      setName(""); setFile(null); setLinkUrl("");
      refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleToggle(m: Material) {
    setMaterials((prev) => prev.map((x) => x.id === m.id ? { ...x, isActive: !x.isActive } : x));
    await toggleMaterialActive(m.id, !m.isActive);
  }

  async function handleDelete(m: Material) {
    if (!confirm(`Usunąć „${m.filename}"?`)) return;
    setMaterials((prev) => prev.filter((x) => x.id !== m.id));
    await deleteMaterial(m.id);
  }

  function openAccess(m: Material) {
    setAccessFor(m.id);
    setAccessSel(new Set(m.partnerIds));
  }

  async function saveAccess() {
    if (!accessFor) return;
    const ids = Array.from(accessSel);
    setMaterials((prev) => prev.map((x) => x.id === accessFor ? { ...x, partnerIds: ids } : x));
    await setMaterialAccess(accessFor, ids);
    setAccessFor(null);
  }

  const isExternal = (url: string) => url.startsWith("http");

  return (
    <div style={{ padding: 32, maxWidth: 1100 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 6 }}>Materiały marketingowe</h1>
      <p style={{ fontSize: 14, color: "var(--ink-3)", marginBottom: 24 }}>
        Wgraj pliki lub dodaj linki, a następnie nadaj dostęp konkretnym partnerom.
      </p>

      {/* Add form */}
      <div className="card" style={{ padding: 20, marginBottom: 28 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button className={`chip box ${mode === "file" ? "sel" : ""}`} onClick={() => setMode("file")}>Plik</button>
          <button className={`chip box ${mode === "link" ? "sel" : ""}`} onClick={() => setMode("link")}>Link (np. wideo)</button>
        </div>

        <form onSubmit={handleAdd} style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 12, alignItems: "end" }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-3)", display: "block", marginBottom: 6 }}>Nazwa</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="np. Katalog automatów 2026" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-3)", display: "block", marginBottom: 6 }}>Typ</label>
            <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
          </div>

          {mode === "file" ? (
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-3)", display: "block", marginBottom: 6 }}>Plik (max 100 MB)</label>
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
          ) : (
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-3)", display: "block", marginBottom: 6 }}>Link</label>
              <input className="input" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://youtube.com/..." />
            </div>
          )}

          {error && <div style={{ gridColumn: "1 / -1", color: "var(--danger)", fontSize: 13 }}>{error}</div>}

          <div style={{ gridColumn: "1 / -1" }}>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              <Icon name="plus" size={16} />{busy ? "Dodawanie…" : "Dodaj materiał"}
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      {materials.length === 0 ? (
        <div style={{ padding: 32, textAlign: "center", background: "var(--surface-2)", borderRadius: "var(--r)", color: "var(--ink-3)" }}>
          Brak materiałów — dodaj pierwszy powyżej.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {materials.map((m) => (
            <div key={m.id} className="card" style={{ padding: 16, display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center", opacity: m.isActive ? 1 : 0.55 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, background: "var(--brand-soft)", color: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                  <Icon name={isExternal(m.url) ? "globe" : "fileText"} size={18} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.filename}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                    {TYPE_LABELS[m.type] ?? m.type}{m.fileSize ? ` · ${fmtSize(m.fileSize)}` : ""} · dostęp: {m.partnerIds.length} {m.partnerIds.length === 1 ? "partner" : "partnerów"}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button className="btn btn-soft btn-sm" onClick={() => openAccess(m)}>
                  <Icon name="users" size={14} />Dostęp
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleToggle(m)}>
                  {m.isActive ? "Ukryj" : "Pokaż"}
                </button>
                <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => handleDelete(m)}>
                  <Icon name="trash" size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Access modal */}
      {accessFor && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setAccessFor(null)}>
          <div className="card" style={{ padding: 24, maxWidth: 460, width: "90%", maxHeight: "80vh", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Dostęp partnerów</h3>
            <p style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 14 }}>Zaznacz partnerów, którzy mają widzieć ten materiał.</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setAccessSel(new Set(partners.map((p) => p.id)))}>Zaznacz wszystkich</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setAccessSel(new Set())}>Wyczyść</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
              {partners.map((p) => {
                const on = accessSel.has(p.id);
                return (
                  <label key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, cursor: "pointer", background: on ? "var(--brand-soft)" : "transparent" }}>
                    <input type="checkbox" checked={on} onChange={() => {
                      setAccessSel((prev) => { const n = new Set(prev); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n; });
                    }} />
                    <span style={{ fontSize: 14 }}>{p.name}</span>
                  </label>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={saveAccess}>Zapisz dostęp</button>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setAccessFor(null)}>Anuluj</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
