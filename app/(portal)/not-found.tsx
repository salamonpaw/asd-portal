import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export default function NotFound() {
  return (
    <div
      style={{
        padding: "64px 32px",
        textAlign: "center",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--paper)",
      }}
    >
      <div style={{ maxWidth: "500px" }}>
        <div style={{ marginBottom: 24 }}>
          <Icon name="search-off" size={64} style={{ color: "var(--warn)" }} />
        </div>

        <h1 style={{ fontSize: 32, fontWeight: 600, marginBottom: 8, color: "var(--ink)" }}>
          Strona nie znaleziona
        </h1>

        <p style={{ fontSize: 16, color: "var(--ink-3)", marginBottom: 32, lineHeight: 1.6 }}>
          Nie znaleźliśmy strony, którą szukasz. Sprawdź URL lub wróć do głównego ekranu.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          <Link
            href="/"
            style={{
              padding: "12px 16px",
              background: "var(--brand)",
              color: "white",
              border: "none",
              borderRadius: "var(--r-sm)",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Icon name="home" size={16} />
            Strona główna
          </Link>

          <Link
            href="/changelog"
            style={{
              padding: "12px 16px",
              background: "var(--surface)",
              color: "var(--brand)",
              border: "1px solid var(--ink-2)",
              borderRadius: "var(--r-sm)",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Icon name="file-text" size={16} />
            Changelog
          </Link>
        </div>

        <div style={{ fontSize: 13, color: "var(--ink-3)" }}>
          Kod błędu: <span style={{ fontFamily: "monospace" }}>404</span>
        </div>
      </div>
    </div>
  );
}
