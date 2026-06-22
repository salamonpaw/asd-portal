"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
          <Icon name="alert-circle" size={64} style={{ color: "var(--danger)" }} />
        </div>

        <h1 style={{ fontSize: 32, fontWeight: 600, marginBottom: 8, color: "var(--ink)" }}>
          Coś poszło nie tak
        </h1>

        <p style={{ fontSize: 16, color: "var(--ink-3)", marginBottom: 24, lineHeight: 1.6 }}>
          Napotkaliśmy nieoczekiwany błąd. Spróbuj odświeżyć stronę lub wróć do głównego ekranu.
        </p>

        {error.message && (
          <div
            style={{
              padding: 16,
              background: "var(--danger-soft)",
              borderRadius: "var(--r-sm)",
              marginBottom: 24,
              fontSize: 12,
              color: "var(--danger)",
              fontFamily: "monospace",
              textAlign: "left",
              maxHeight: "120px",
              overflow: "auto",
            }}
          >
            {error.message}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={reset}
            style={{
              padding: "10px 20px",
              background: "var(--brand)",
              color: "white",
              border: "none",
              borderRadius: "var(--r-sm)",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Icon name="rotate-cw" size={16} />
            Spróbuj ponownie
          </button>

          <Link
            href="/"
            style={{
              padding: "10px 20px",
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
              gap: 8,
            }}
          >
            <Icon name="home" size={16} />
            Strona główna
          </Link>
        </div>
      </div>
    </div>
  );
}
