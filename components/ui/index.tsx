"use client";

import { Icon } from "./Icon";

// ─── Logo ────────────────────────────────────────────────────────────────────

function LogoFallback({ size, light }: { size: number; light: boolean }) {
  const ink = light ? "#fff" : "var(--brand)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={{ flex: "none" }}>
        <rect x="2" y="2" width="36" height="36" rx="9" fill={light ? "rgba(255,255,255,.25)" : "var(--brand)"} />
        <text x="20" y="26" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700" fontFamily="system-ui">ASD</text>
      </svg>
      <span style={{ fontFamily: "var(--font-display), 'Space Grotesk', sans-serif", fontWeight: 600, fontSize: size * 0.52, color: ink, letterSpacing: "-.02em", lineHeight: 1 }}>
        ASD <span style={{ fontWeight: 400, opacity: 0.85 }}>Systems</span>
      </span>
    </div>
  );
}

export function Logo({ size = 30, light = false }: { size?: number; light?: boolean }) {
  const height = Math.round(size * 0.7);

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <img
        src="/logo.png"
        alt="ASD Systems"
        height={height}
        style={{
          height,
          width: "auto",
          flex: "none",
          filter: light ? "brightness(0) invert(1)" : "none",
        }}
        onError={(e) => {
          // hide broken img, show fallback sibling
          (e.target as HTMLImageElement).style.display = "none";
          const next = (e.target as HTMLImageElement).nextElementSibling as HTMLElement | null;
          if (next) next.style.display = "flex";
        }}
      />
      {/* shown only when logo.png is missing */}
      <span style={{ display: "none" }}>
        <LogoFallback size={size} light={light} />
      </span>
    </div>
  );
}

// ─── Badge ───────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  NEW:      { label: "Nowe zgłoszenie",        cls: "st-new" },
  VERIFY:   { label: "Do weryfikacji",          cls: "st-verify" },
  ACTIVE:   { label: "Aktywny – chroniony",     cls: "st-active" },
  NOPROT:   { label: "Aktywny bez ochrony",     cls: "st-noprot" },
  NEEDINFO: { label: "Wymaga uzupełnienia",     cls: "st-needinfo" },
  DUP:      { label: "Duplikat",                cls: "st-dup" },
  REJECT:   { label: "Odrzucony",               cls: "st-reject" },
  EXPIRED:  { label: "Wygasły",                 cls: "st-expired" },
  DEACT:    { label: "Dezaktywowany",           cls: "st-deact" },
  WON:      { label: "Zamknięty sukcesem",      cls: "st-won" },
  LOST:     { label: "Zamknięty – utracony",    cls: "st-lost" },
};

export function Badge({ status, children }: { status: string; children?: React.ReactNode }) {
  const st = STATUS_MAP[status];
  return (
    <span className={`badge ${st?.cls ?? "st-new"}`}>
      <span className="dot" />
      {children ?? st?.label ?? status}
    </span>
  );
}

// ─── Avatar ──────────────────────────────────────────────────────────────────

export function Avatar({ initials, size = 34, color = "var(--brand)" }: { initials: string; size?: number; color?: string }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 9, background: color, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: size * 0.38,
      fontFamily: "var(--font-display), 'Space Grotesk', sans-serif", flex: "none", letterSpacing: "-.01em",
    }}>
      {initials}
    </div>
  );
}

// ─── KV ──────────────────────────────────────────────────────────────────────

export function KV({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".04em", fontWeight: 600 }}>{label}</div>
      <div className={mono ? "mono" : ""} style={{ fontSize: 14.5, marginTop: 4, fontWeight: 500, color: "var(--ink)" }}>{children}</div>
    </div>
  );
}

// ─── SectionCard ─────────────────────────────────────────────────────────────

export function SectionCard({
  title, action, children, pad = true, style,
}: {
  title?: string; action?: React.ReactNode; children: React.ReactNode; pad?: boolean; style?: React.CSSProperties;
}) {
  return (
    <div className="card" style={style}>
      {title && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
          <h3 style={{ fontSize: 16 }}>{title}</h3>
          {action}
        </div>
      )}
      <div style={{ padding: pad ? 20 : 0 }}>{children}</div>
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────

export function Modal({ open, onClose, children, width = 540 }: { open: boolean; onClose: () => void; children: React.ReactNode; width?: number }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(20,24,34,.42)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{ width, maxWidth: "100%", maxHeight: "90vh", overflow: "auto", boxShadow: "var(--sh-3)", animation: "pop .2s ease both" }}>
        {children}
      </div>
    </div>
  );
}

// ─── Field ───────────────────────────────────────────────────────────────────

export function Field({
  label, req, hint, error, children, full, style,
}: {
  label?: string; req?: boolean; hint?: string; error?: string; children: React.ReactNode; full?: boolean; style?: React.CSSProperties;
}) {
  return (
    <div className="field" style={{ gridColumn: full ? "1 / -1" : undefined, ...(style ?? {}) }}>
      {label && <label>{label}{req && <span className="req">*</span>}</label>}
      {children}
      {error
        ? <div className="hint" style={{ color: "var(--danger)", fontWeight: 600 }}>{error}</div>
        : hint
        ? <div className="hint">{hint}</div>
        : null}
    </div>
  );
}

// ─── StatCard ────────────────────────────────────────────────────────────────

export function StatCard({ icon, label, value, tone = "var(--brand)", soft = "var(--brand-soft)", onClick }: {
  icon: string; label: string; value: number; tone?: string; soft?: string; onClick?: () => void;
}) {
  return (
    <div className="card" onClick={onClick} style={{ padding: 20, cursor: onClick ? "pointer" : "default" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: soft, color: tone, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon} size={21} />
        </div>
        {onClick && <Icon name="arrowRight" size={17} style={{ color: "var(--ink-4)" }} />}
      </div>
      <div style={{ fontFamily: "var(--font-display), 'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 32, marginTop: 16, lineHeight: 1, letterSpacing: "-.02em" }}>{value}</div>
      <div style={{ color: "var(--ink-2)", fontSize: 14, marginTop: 7, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

// ─── PageHead ────────────────────────────────────────────────────────────────

export function PageHead({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
      <div>
        <h1 style={{ fontSize: 27, letterSpacing: "-.02em" }}>{title}</h1>
        {sub && <p style={{ color: "var(--ink-3)", marginTop: 6, fontSize: 14.5 }}>{sub}</p>}
      </div>
      {children && <div style={{ display: "flex", gap: 10, alignItems: "center" }}>{children}</div>}
    </div>
  );
}

// ─── EmptyState ──────────────────────────────────────────────────────────────

export function EmptyState({ title = "Brak projektów", sub = "Nie ma tu jeszcze żadnych pozycji.", icon = "layers", children }: {
  title?: string; sub?: string; icon?: string; children?: React.ReactNode;
}) {
  return (
    <div style={{ textAlign: "center", padding: "52px 20px", color: "var(--ink-3)" }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--surface-3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "var(--ink-4)" }}>
        <Icon name={icon} size={26} />
      </div>
      <div style={{ fontWeight: 600, color: "var(--ink-2)", fontSize: 16 }}>{title}</div>
      <div style={{ fontSize: 14, marginTop: 5 }}>{sub}</div>
      {children && <div style={{ marginTop: 18 }}>{children}</div>}
    </div>
  );
}

// ─── FilterTabs ──────────────────────────────────────────────────────────────

export function FilterTabs({ tabs, active, onChange }: {
  tabs: { key: string; label: string; count?: number }[];
  active: string;
  onChange: (k: string) => void;
}) {
  return (
    <div className="filtabs">
      {tabs.map((t) => (
        <button key={t.key} className={active === t.key ? "active" : ""} onClick={() => onChange(t.key)}>
          {t.label}
          {t.count != null && <span className="cnt">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

// ─── Timeline ────────────────────────────────────────────────────────────────

export function Timeline({ items }: { items: { date: string; who: string; text: string }[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {items.map((h, i) => (
        <div key={i} style={{ display: "flex", gap: 14, paddingBottom: i === items.length - 1 ? 0 : 18, position: "relative" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 10, height: 10, borderRadius: 99, background: i === items.length - 1 ? "var(--accent)" : "var(--brand)", flex: "none", marginTop: 4 }} />
            {i !== items.length - 1 && <div style={{ flex: 1, width: 2, background: "var(--line)", marginTop: 4 }} />}
          </div>
          <div style={{ paddingBottom: 2 }}>
            <div style={{ fontSize: 14, color: "var(--ink)" }}>{h.text}</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{h.who} · {h.date}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export { Icon };
