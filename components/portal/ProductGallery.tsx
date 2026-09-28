"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { SafeImg } from "@/components/ui/SafeImg";

/** Galeria zdjęć produktu: zdjęcie główne + miniatury (klik = podmiana). */
export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div style={{ textAlign: "center", color: "var(--ink-3)", padding: 48 }}>
        <Icon name="image" size={48} />
        <p style={{ marginTop: 12, fontSize: 13 }}>Brak zdjęć produktu</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ background: "var(--surface-2)", borderRadius: "var(--r)", padding: 24, textAlign: "center", minHeight: 300, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
        <SafeImg key={images[active]} src={images[active]} alt={name} style={{ maxWidth: "100%", maxHeight: 300, borderRadius: "var(--r-sm)" }} />
      </div>
      {images.length > 1 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 8 }}>
          {images.map((img, idx) => (
            <button
              key={img}
              type="button"
              onClick={() => setActive(idx)}
              style={{
                background: "var(--surface-2)", border: `2px solid ${idx === active ? "var(--brand)" : "transparent"}`,
                borderRadius: "var(--r-sm)", padding: 4, cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", minHeight: 80,
              }}
            >
              <SafeImg src={img} alt={`${name} — zdjęcie ${idx + 1}`} style={{ maxWidth: "100%", maxHeight: 70 }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
