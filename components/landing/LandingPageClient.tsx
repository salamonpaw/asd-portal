"use client";

import Link from "next/link";
import { useContentItems } from "@/lib/hooks/useContentItems";
import { Logo } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";

export function LandingPageClient() {
  const { items, loading } = useContentItems("Landing page");

  if (loading) {
    return <div style={{ minHeight: "100vh", background: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center" }}><div>Ładowanie...</div></div>;
  }

  // Build content map
  const c = items.reduce((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {} as Record<string, string>);

  const toArray = (str: string) => str.split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(244,242,236,.88)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--line)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Logo width={120} />
          <nav style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <a href="#proces" className="land-link">Jak to działa</a>
            <a href="#ochrona" className="land-link">Ochrona projektu</a>
            <a href="#statuses" className="land-link">Statusy projektów</a>
            <Link href="/login" className="btn btn-brand" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Icon name="logout" size={16} />Zaloguj się
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(900px 480px at 78% -8%, var(--brand-soft), transparent 60%), radial-gradient(700px 420px at 8% 120%, var(--accent-soft), transparent 55%)" }} />
        <div style={{ position: "relative", maxWidth: 1180, margin: "0 auto", padding: "72px 28px 64px", display: "grid", gridTemplateColumns: "1.05fr .95fr", gap: 56, alignItems: "center" }}>
          <div className="fadeup">
            <div className="land-eyebrow"><Icon name="shieldCheck" size={15} />Program Partnerski ASD Systems</div>
            <h1 style={{ fontSize: 50, lineHeight: 1.05, marginTop: 18, letterSpacing: "-.025em" }}>
              {c["landing.hero.title"]}
            </h1>
            <p style={{ fontSize: 18.5, color: "var(--ink-2)", marginTop: 20, maxWidth: 520, lineHeight: 1.55 }}>
              {c["landing.hero.subtitle"]}
            </p>
            <p style={{ fontSize: 15.5, color: "var(--ink-2)", marginTop: 16, maxWidth: 540, lineHeight: 1.6 }}>
              {c["landing.hero.description"]}
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 30, flexWrap: "wrap" }}>
              <Link href="/login" className="btn btn-primary btn-lg" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Icon name="plus" size={17} />{c["landing.hero.cta1"]}
              </Link>
              <a href="#features" className="btn btn-ghost btn-lg">{c["landing.hero.cta2"]}</a>
            </div>
          </div>
          <div className="fadeup" style={{ animationDelay: ".08s" }}>
            <div style={{ position: "relative" }}>
              <div className="card" style={{ padding: 22, boxShadow: "var(--sh-3)", transform: "rotate(-1.4deg)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div className="mono" style={{ fontSize: 12.5, color: "var(--ink-3)" }}>ASD-PRJ-2026-0052</div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 18, marginTop: 4 }}>Volkswagen Poznań Sp. z o.o.</div>
                  </div>
                  <span className="badge st-active"><span className="dot" />Aktywny</span>
                </div>
                <div style={{ display: "flex", gap: 18, marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
                  <div><div className="land-k">NIP</div><div className="mono" style={{ fontWeight: 600 }}>5871122003</div></div>
                  <div><div className="land-k">Automaty</div><div style={{ fontWeight: 600 }}>8–10 szt.</div></div>
                  <div><div className="land-k">Typ</div><div style={{ fontWeight: 600 }}>BHP / MRO</div></div>
                </div>
                <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: "var(--r-sm)", background: "var(--ok-soft)", display: "flex", alignItems: "center", gap: 10, color: "#14633f" }}>
                  <Icon name="shieldCheck" size={20} />
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>Relacja chroniona do 28 sie 2026</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 28px" }}>
        {/* Problem */}
        <section style={{ marginTop: 80 }}>
          <h2 style={{ fontSize: 34, lineHeight: 1.1, letterSpacing: "-.02em", maxWidth: 700 }}>{c["landing.problem.title"]}</h2>
          <p style={{ color: "var(--ink-2)", marginTop: 16, fontSize: 16, maxWidth: 700, lineHeight: 1.55 }}>
            {c["landing.problem.description"]}
          </p>
          <div style={{ marginTop: 28, padding: 32, background: "var(--surface-2)", borderRadius: "var(--r-lg)", borderLeft: "4px solid var(--warn)" }}>
            <div style={{ fontSize: 13.5, color: "var(--ink-3)", fontWeight: 600, marginBottom: 14 }}>Pytania które pojawiają się w sprzedaży:</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {toArray(c["landing.problem.questions"]).map((q, i) => (
                <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 15 }}>
                  <Icon name="helpCircle" size={16} style={{ flex: "none", marginTop: 2, color: "var(--warn)" }} />
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Values */}
        <section style={{ marginTop: 80 }}>
          <h2 style={{ fontSize: 34, letterSpacing: "-.02em" }}>{c["landing.values.title"]}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginTop: 40 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="card" style={{ padding: 30 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600 }}>{c[`landing.values.v${i}_title`]}</h3>
                <p style={{ color: "var(--ink-2)", marginTop: 12, fontSize: 14.5, lineHeight: 1.55 }}>
                  {c[`landing.values.v${i}_desc`]}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" style={{ marginTop: 80 }}>
          <h2 style={{ fontSize: 34, letterSpacing: "-.02em" }}>{c["landing.features.title"]}</h2>
          <p style={{ color: "var(--ink-2)", marginTop: 12, fontSize: 16, maxWidth: 700, lineHeight: 1.55 }}>
            {c["landing.features.intro"]}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginTop: 40 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="card" style={{ padding: 24 }}>
                <div style={{ width: 44, height: 44, borderRadius: 11, background: "var(--brand-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand)", fontSize: 18, fontWeight: 600 }}>
                  {i}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 600, marginTop: 16 }}>{c[`landing.features.f${i}_title`]}</h3>
                <p style={{ color: "var(--ink-2)", marginTop: 10, fontSize: 14.5, lineHeight: 1.55 }}>
                  {c[`landing.features.f${i}_desc`]}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Process */}
        <section id="proces" style={{ marginTop: 80 }}>
          <h2 style={{ fontSize: 34, letterSpacing: "-.02em", marginBottom: 40 }}>{c["landing.process.title"]}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, position: "relative" }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ position: "relative", paddingTop: 22 }}>
                <div style={{ position: "absolute", top: 0, left: 0, width: 40, height: 40, borderRadius: 11, background: "var(--brand)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 600 }}>
                  {i}
                </div>
                <div className="card" style={{ padding: 20, paddingLeft: 26, paddingTop: 48 }}>
                  <h4 style={{ fontSize: 16, fontWeight: 600 }}>{c[`landing.process.step${i}_title`]}</h4>
                  <p style={{ color: "var(--ink-2)", marginTop: 10, fontSize: 14.5, lineHeight: 1.5 }}>
                    {c[`landing.process.step${i}_desc`]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Client benefits */}
        <section style={{ marginTop: 80 }}>
          <h2 style={{ fontSize: 34, letterSpacing: "-.02em", maxWidth: 700 }}>{c["landing.client.title"]}</h2>
          <p style={{ color: "var(--ink-2)", marginTop: 16, fontSize: 16, maxWidth: 700, lineHeight: 1.55 }}>
            {c["landing.client.intro"]}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18, marginTop: 40 }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} style={{ padding: 24, borderRadius: "var(--r-lg)", border: "1px solid var(--line)", background: "var(--surface)" }}>
                <h4 style={{ fontSize: 16, fontWeight: 600 }}>{c[`landing.client.v${i}_title`]}</h4>
                <p style={{ color: "var(--ink-2)", marginTop: 10, fontSize: 14.5, lineHeight: 1.5 }}>
                  {c[`landing.client.v${i}_desc`]}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Operator benefits */}
        <section style={{ marginTop: 80, paddingBottom: 20 }}>
          <h2 style={{ fontSize: 34, letterSpacing: "-.02em", maxWidth: 700 }}>{c["landing.operator.title"]}</h2>
          <p style={{ color: "var(--ink-2)", marginTop: 16, fontSize: 16, maxWidth: 700, lineHeight: 1.55 }}>
            {c["landing.operator.intro"]}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18, marginTop: 40 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ padding: 24, borderRadius: "var(--r-lg)", border: "1px solid var(--line)", background: "var(--surface)" }}>
                <h4 style={{ fontSize: 16, fontWeight: 600 }}>{c[`landing.operator.v${i}_title`]}</h4>
                <p style={{ color: "var(--ink-2)", marginTop: 10, fontSize: 14.5, lineHeight: 1.5 }}>
                  {c[`landing.operator.v${i}_desc`]}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Trust/Security */}
        <section id="ochrona" style={{ marginTop: 80 }}>
          <h2 style={{ fontSize: 34, letterSpacing: "-.02em" }}>{c["landing.trust.title"]}</h2>
          <p style={{ color: "var(--ink-2)", marginTop: 16, fontSize: 16, maxWidth: 700, lineHeight: 1.55 }}>
            {c["landing.trust.intro"]}
          </p>
          <div style={{ marginTop: 32, padding: 32, background: "var(--ok-soft)", borderRadius: "var(--r-lg)" }}>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
              {toArray(c["landing.trust.points"]).map((p, i) => (
                <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 15 }}>
                  <Icon name="check" size={20} style={{ flex: "none", color: "var(--ok)", marginTop: 1 }} />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <p style={{ color: "var(--ink-2)", marginTop: 20, fontSize: 15, maxWidth: 700, lineHeight: 1.55, fontStyle: "italic" }}>
            {c["landing.trust.note"]}
          </p>
        </section>

        {/* FAQ */}
        <section style={{ marginTop: 80 }}>
          <h2 style={{ fontSize: 34, letterSpacing: "-.02em" }}>{c["landing.faq.title"]}</h2>
          <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card" style={{ padding: 28 }}>
                <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{c[`landing.faq.q${i}`]}</h4>
                <p style={{ color: "var(--ink-2)", fontSize: 14.5, lineHeight: 1.55 }}>
                  {c[`landing.faq.a${i}`]}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Statuses */}
        <section id="statuses" style={{ marginTop: 80 }}>
          <h2 style={{ fontSize: 34, letterSpacing: "-.02em" }}>{c["landing.statuses.title"]}</h2>
          <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {[
              { key: "new", label: "Nowy projekt" },
              { key: "needinfo", label: "Do uzupełnienia" },
              { key: "verify", label: "W analizie ASD" },
              { key: "active", label: "Wsparcie sprzedażowe" },
              { key: "won", label: "Wygrany" },
              { key: "lost", label: "Utracony" },
            ].map((s) => (
              <div key={s.key} className="card" style={{ padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 5, background: "var(--brand)" }} />
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>{s.label}</span>
                </div>
                <p style={{ color: "var(--ink-2)", fontSize: 14.5, lineHeight: 1.5 }}>
                  {c[`landing.statuses.${s.key}`]}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Final */}
        <section style={{ marginTop: 80, marginBottom: 80, textAlign: "center" }}>
          <h2 style={{ fontSize: 40, letterSpacing: "-.02em", maxWidth: 800, margin: "0 auto" }}>
            {c["landing.cta.title"]}
          </h2>
          <p style={{ color: "var(--ink-2)", marginTop: 20, fontSize: 16.5, maxWidth: 700, margin: "20px auto 0", lineHeight: 1.55 }}>
            {c["landing.cta.description"]}
          </p>
          <div style={{ display: "flex", gap: 14, marginTop: 32, flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/login" className="btn btn-primary btn-lg">{c["landing.cta.btn1"]}</Link>
            <Link href="/login" className="btn btn-ghost btn-lg">{c["landing.cta.btn2"]}</Link>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--line)", marginTop: 40 }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <Logo width={100} />
          <div style={{ color: "var(--ink-3)", fontSize: 13.5 }}>ASD Partner Portal · Rejestr Projektów Partnerskich · © 2026</div>
        </div>
      </footer>
    </div>
  );
}
