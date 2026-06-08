"use client";

import { useState } from "react";
import { PageHead, SectionCard } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import type { ContentItem } from "@prisma/client";

export function ContentManagerClient({ items: initial }: { items: ContentItem[] }) {
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const [saving, setSaving] = useState(false);

  const groups = [...new Set(items.map((i) => i.group))].sort();

  function startEdit(item: ContentItem) {
    setEditing(item.id);
    setEditVal(item.value);
  }

  async function saveItem(id: string) {
    setSaving(true);
    const res = await fetch(`/api/admin/content/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: editVal }),
    });
    if (res.ok) {
      const updated = await res.json();
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
      setEditing(null);
    }
    setSaving(false);
  }

  return (
    <div className="fadeup">
      <PageHead
        title="Zarządzanie treścią portalu"
        sub="Edytuj etykiety, opisy i placeholdery wyświetlane użytkownikom portalu."
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {groups.map((group) => {
          const groupItems = items.filter((i) => i.group === group);
          return (
            <SectionCard key={group} title={group} pad={false}>
              <div>
                {groupItems.map((item) => (
                  <div key={item.id} style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)", display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-2)", marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 11, color: "var(--ink-4)", fontFamily: "var(--font-mono)", marginBottom: 8 }}>{item.key}</div>

                      {editing === item.id ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {item.value.length > 80 ? (
                            <textarea
                              className="textarea"
                              style={{ minHeight: 80 }}
                              value={editVal}
                              onChange={(e) => setEditVal(e.target.value)}
                              autoFocus
                            />
                          ) : (
                            <input
                              className="input"
                              value={editVal}
                              onChange={(e) => setEditVal(e.target.value)}
                              autoFocus
                            />
                          )}
                          <div style={{ display: "flex", gap: 8 }}>
                            <button className="btn btn-primary btn-sm" onClick={() => saveItem(item.id)} disabled={saving}>
                              <Icon name="check" size={14} />{saving ? "Zapisywanie…" : "Zapisz"}
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>Anuluj</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: 14, color: "var(--ink)", background: "var(--surface-2)", padding: "8px 11px", borderRadius: "var(--r-sm)", border: "1px solid var(--line)", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                          {item.value}
                        </div>
                      )}
                    </div>
                    {editing !== item.id && (
                      <button className="btn btn-soft btn-sm" onClick={() => startEdit(item)} style={{ flex: "none", marginTop: 24 }}>
                        <Icon name="edit" size={14} />Edytuj
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>
          );
        })}
      </div>
    </div>
  );
}
