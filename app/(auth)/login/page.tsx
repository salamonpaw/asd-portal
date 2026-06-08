"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Nieprawidłowy e-mail lub hasło.");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
      {/* Left panel */}
      <div style={{ background: "linear-gradient(165deg, var(--brand), var(--brand-900))", color: "#fff", padding: "48px 56px", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(600px 400px at 90% 10%, rgba(224,97,47,.22), transparent 60%)" }} />
        <div style={{ position: "relative" }}><Logo width={140} light /></div>
        <div style={{ position: "relative" }}>
          <div className="land-eyebrow" style={{ background: "rgba(255,255,255,.12)", color: "#fff" }}>
            <Icon name="shieldCheck" size={15} />Partner Portal
          </div>
          <h1 style={{ color: "#fff", fontSize: 38, marginTop: 18, lineHeight: 1.1 }}>Zgłaszaj projekty.<br />Zabezpiecz relację.</h1>
          <p style={{ color: "rgba(255,255,255,.72)", marginTop: 16, fontSize: 16, maxWidth: 380, lineHeight: 1.55 }}>
            Rejestr Projektów Partnerskich ASD Systems — zarządzaj projektami i chroń swoje relacje z klientami.
          </p>
        </div>
        <div style={{ position: "relative", fontSize: 13, color: "rgba(255,255,255,.5)" }}>© 2026 ASD Systems</div>
      </div>

      {/* Right panel */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40, background: "var(--paper)" }}>
        <div style={{ width: 380, maxWidth: "100%" }}>
          <h2 style={{ fontSize: 26 }}>Zaloguj się</h2>
          <p style={{ color: "var(--ink-3)", fontSize: 14.5, marginTop: 6 }}>Partner Portal ASD Systems</p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 28 }}>
            <div className="field">
              <label>E-mail</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="twoj@email.pl"
                required
              />
            </div>
            <div className="field">
              <label>Hasło</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div style={{ padding: "10px 14px", borderRadius: "var(--r-sm)", background: "var(--danger-soft)", color: "var(--danger)", fontSize: 14, fontWeight: 600 }}>
                {error}
              </div>
            )}

            <button className="btn btn-brand btn-lg" type="submit" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? "Logowanie…" : "Zaloguj się"}
              {!loading && <Icon name="arrowRight" size={16} />}
            </button>
          </form>

          <div style={{ marginTop: 28, padding: 16, borderRadius: "var(--r)", background: "var(--surface-3)", fontSize: 13, color: "var(--ink-3)" }}>
            <strong style={{ color: "var(--ink-2)" }}>Konta testowe:</strong><br />
            Partner: p.nowak@vendmax.pl / demo1234<br />
            Handlowiec: m.kowalczyk@asdsystems.pl / demo1234
          </div>
        </div>
      </div>
    </div>
  );
}
