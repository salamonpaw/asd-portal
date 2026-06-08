import Link from "next/link";
import { Logo } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";

// ─── Header ──────────────────────────────────────────────────────────────────

function LandHeader() {
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(244,242,236,.88)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--line)" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Logo width={120} />
        <nav style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <a href="#jak" className="land-link">Jak to działa</a>
          <a href="#ochrona" className="land-link">Ochrona projektu</a>
          <a href="#kroki" className="land-link">Zgłoszenie</a>
          <Link href="/login" className="btn btn-brand" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Icon name="logout" size={16} />Zaloguj się
          </Link>
        </nav>
      </div>
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function LandHero() {
  return (
    <section style={{ position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(900px 480px at 78% -8%, var(--brand-soft), transparent 60%), radial-gradient(700px 420px at 8% 120%, var(--accent-soft), transparent 55%)" }} />
      <div style={{ position: "relative", maxWidth: 1180, margin: "0 auto", padding: "72px 28px 64px", display: "grid", gridTemplateColumns: "1.05fr .95fr", gap: 56, alignItems: "center" }}>
        <div className="fadeup">
          <div className="land-eyebrow"><Icon name="shieldCheck" size={15} />Program Partnerski ASD Systems</div>
          <h1 style={{ fontSize: 50, lineHeight: 1.05, marginTop: 18, letterSpacing: "-.025em" }}>
            Zgłaszaj projekty i&nbsp;zabezpiecz swoją relację z&nbsp;klientem
          </h1>
          <p style={{ fontSize: 18.5, color: "var(--ink-2)", marginTop: 20, maxWidth: 520, lineHeight: 1.55 }}>
            Rejestrujesz klienta końcowego po NIP / Tax ID, a&nbsp;ASD Systems gwarantuje, że jeśli ten klient zgłosi się
            bezpośrednio do nas — <strong style={{ color: "var(--ink)" }}>przekierujemy go do Ciebie</strong>.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 30, flexWrap: "wrap" }}>
            <Link href="/login" className="btn btn-primary btn-lg" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Icon name="plus" size={17} />Zgłoś projekt
            </Link>
            <a href="#jak" className="btn btn-ghost btn-lg">Zobacz, jak to działa</a>
          </div>
          <div style={{ display: "flex", gap: 26, marginTop: 34, color: "var(--ink-3)", fontSize: 14, flexWrap: "wrap" }}>
            <span style={{ display: "flex", gap: 8, alignItems: "center" }}><Icon name="check" size={16} style={{ color: "var(--ok)" }} />Bez wyłączności rynkowej</span>
            <span style={{ display: "flex", gap: 8, alignItems: "center" }}><Icon name="check" size={16} style={{ color: "var(--ok)" }} />Pierwszeństwo kontaktu</span>
            <span style={{ display: "flex", gap: 8, alignItems: "center" }}><Icon name="check" size={16} style={{ color: "var(--ok)" }} />Wpływ na rabat</span>
          </div>
        </div>
        <div className="fadeup" style={{ animationDelay: ".08s" }}>
          <HeroCard />
        </div>
      </div>
    </section>
  );
}

function HeroCard() {
  return (
    <div style={{ position: "relative" }}>
      <div className="card" style={{ padding: 22, boxShadow: "var(--sh-3)", transform: "rotate(-1.4deg)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="mono" style={{ fontSize: 12.5, color: "var(--ink-3)" }}>ASD-PRJ-2026-0052</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 18, marginTop: 4 }}>Volkswagen Poznań Sp. z o.o.</div>
          </div>
          <span className="badge st-active"><span className="dot" />Aktywny – chroniony</span>
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
      <div className="card" style={{ position: "absolute", right: -16, bottom: -28, padding: "14px 16px", boxShadow: "var(--sh-3)", transform: "rotate(2deg)", display: "flex", alignItems: "center", gap: 12, width: 240 }}>
        <div style={{ width: 38, height: 38, borderRadius: 9, background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontFamily: "var(--font-display)", flex: "none" }}>MK</div>
        <div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>Klient skontaktował się z ASD</div>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>→ przekazany do Vendmax</div>
        </div>
      </div>
    </div>
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────────

function LandSteps() {
  const steps = [
    { ic: "send",        t: "Partner zgłasza klienta",  d: "Wypełniasz krótki formularz — kluczem jest NIP / Tax ID klienta końcowego." },
    { ic: "shieldCheck", t: "ASD akceptuje projekt",    d: "Twój Handlowiec weryfikuje zgłoszenie i nadaje ochronę relacji." },
    { ic: "arrowRight",  t: "Klient trafia do Ciebie",  d: "Gdy klient skontaktuje się z ASD bezpośrednio — kierujemy go do Ciebie." },
  ];
  return (
    <section id="jak" className="land-sec">
      <LandHead eyebrow="Jak działa ochrona projektu" title="Trzy kroki do zabezpieczonej relacji" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginTop: 40 }}>
        {steps.map((s, i) => (
          <div key={i} className="card" style={{ padding: 26 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div className="land-stepIcon"><Icon name={s.ic} size={22} /></div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 38, color: "var(--surface-3)" }}>0{i + 1}</div>
            </div>
            <h3 style={{ fontSize: 19, marginTop: 16 }}>{s.t}</h3>
            <p style={{ color: "var(--ink-2)", marginTop: 8, fontSize: 15, lineHeight: 1.55 }}>{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Benefits ────────────────────────────────────────────────────────────────

function LandBenefits() {
  const items = [
    { ic: "arrowRight", t: "Przekierowanie klienta",    d: "Klient kontaktujący się z ASD bezpośrednio wraca do Ciebie." },
    { ic: "award",      t: "Wpływ na poziom rabatowy",  d: "Aktywne projekty liczą się do Twojego statusu w Programie Partnerskim." },
    { ic: "briefcase",  t: "Wsparcie sprzedażowe ASD",  d: "Oferty, dobór automatów, udział w spotkaniach, analiza opłacalności." },
    { ic: "star",       t: "Pierwszeństwo obsługi",     d: "Twój Handlowiec prowadzi projekt po stronie ASD od początku." },
  ];
  return (
    <section className="land-sec" style={{ background: "var(--brand-900)", borderRadius: 28, color: "#fff", padding: "56px 48px" }}>
      <div className="land-eyebrow" style={{ color: "var(--accent)", background: "rgba(224,97,47,.16)" }}><Icon name="sparkles" size={15} />Co daje zaakceptowane zgłoszenie</div>
      <h2 style={{ color: "#fff", fontSize: 34, marginTop: 16, maxWidth: 620, lineHeight: 1.1 }}>Ochrona relacji i pierwszeństwo — bez blokowania rynku</h2>
      <p style={{ color: "rgba(255,255,255,.7)", marginTop: 14, maxWidth: 640, fontSize: 16 }}>
        Zgłoszenie nie blokuje działań innych Partnerów wobec tego samego klienta. Daje Ci natomiast realny, mierzalny poziom ochrony.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14, marginTop: 36 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: "flex", gap: 16, padding: 20, borderRadius: "var(--r-lg)", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.09)" }}>
            <div style={{ flex: "none", width: 44, height: 44, borderRadius: 11, background: "rgba(224,97,47,.18)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={it.ic} size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16.5, fontFamily: "var(--font-display)" }}>{it.t}</div>
              <div style={{ color: "rgba(255,255,255,.66)", fontSize: 14.5, marginTop: 5, lineHeight: 1.5 }}>{it.d}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Rules ────────────────────────────────────────────────────────────────────

function LandRules() {
  return (
    <section id="ochrona" className="land-sec">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
        <div className="card" style={{ padding: 30, borderColor: "var(--ok)", background: "linear-gradient(180deg,var(--ok-soft),var(--surface))" }}>
          <div className="land-ruleIcon" style={{ background: "#fff", color: "var(--ok)" }}><Icon name="shieldCheck" size={24} /></div>
          <h3 style={{ fontSize: 22, marginTop: 16 }}>Kiedy projekt jest chroniony</h3>
          <ul className="land-list">
            <li>Bieżąca sprzedaż lub zapytanie ofertowe</li>
            <li>Klient zidentyfikowany po NIP / Tax ID</li>
            <li>Projekt zaakceptowany przez Handlowca ASD</li>
            <li>W ramach rynku przypisanego Partnerowi</li>
          </ul>
        </div>
        <div className="card" style={{ padding: 30, borderColor: "var(--warn)", background: "linear-gradient(180deg,var(--warn-soft),var(--surface))" }}>
          <div className="land-ruleIcon" style={{ background: "#fff", color: "var(--warn)" }}><Icon name="shieldOff" size={24} /></div>
          <h3 style={{ fontSize: 22, marginTop: 16 }}>Kiedy ochrona nie obowiązuje</h3>
          <ul className="land-list">
            <li><strong>Oficjalny przetarg</strong> — wyłącza ochronę partnerską</li>
            <li>Klient już zarejestrowany przez innego Partnera</li>
            <li>Projekt poza przypisanym rynkiem</li>
            <li>Projekt wygasł (po 3 miesiącach) lub został odrzucony</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

// ─── Duration ────────────────────────────────────────────────────────────────

function LandDuration() {
  return (
    <section className="land-sec">
      <div className="card" style={{ padding: "40px 44px", display: "grid", gridTemplateColumns: "auto 1fr", gap: 44, alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 88, lineHeight: 1, color: "var(--brand)" }}>3</div>
          <div style={{ fontSize: 16, color: "var(--ink-2)", fontWeight: 600, marginTop: 4 }}>miesiące ochrony</div>
        </div>
        <div>
          <LandHead inline eyebrow="Jak długo projekt jest aktywny" title="Ochrona liczona od dnia akceptacji" />
          <p style={{ color: "var(--ink-2)", marginTop: 12, fontSize: 16, maxWidth: 560, lineHeight: 1.55 }}>
            Po 3 miesiącach projekt przechodzi w status <strong>Wygasły</strong>. W każdej chwili możesz
            złożyć <strong>kontynuację projektu</strong> — bez zmiany NIP-u, jednym kliknięciem.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
            {["Akceptacja", "+1 mies.", "+2 mies.", "Wygaśnięcie", "Kontynuacja"].map((t, i) => (
              <span key={i} className="badge" style={{
                background: i === 3 ? "var(--expired-soft)" : i === 4 ? "var(--accent-soft)" : "var(--brand-soft)",
                color: i === 3 ? "#5f636b" : i === 4 ? "var(--accent-700)" : "var(--brand)"
              }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── How to submit ────────────────────────────────────────────────────────────

function LandHow() {
  const steps = [
    { t: "Wpisz NIP / Tax ID klienta",     d: "System sprawdza, czy klient nie jest już zarejestrowany." },
    { t: "Uzupełnij dane projektu",         d: "Lokalizacja, skala (liczba automatów), typ postępowania, etap rozmów." },
    { t: "Określ oczekiwane wsparcie",      d: "Oferta, dobór automatów, spotkanie z klientem, warunki handlowe." },
    { t: "Wyślij do akceptacji",            d: "Twój Handlowiec ASD otrzyma powiadomienie i zweryfikuje zgłoszenie." },
  ];
  return (
    <section id="kroki" className="land-sec">
      <LandHead eyebrow="Jak zgłosić projekt" title="Krok po kroku — w kilka minut" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginTop: 38 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ position: "relative", paddingTop: 22 }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: 40, height: 40, borderRadius: 11, background: "var(--brand)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 600 }}>{i + 1}</div>
            <div style={{ paddingLeft: 6, paddingTop: 28 }}>
              <h4 style={{ fontSize: 16.5 }}>{s.t}</h4>
              <p style={{ color: "var(--ink-2)", marginTop: 7, fontSize: 14.5, lineHeight: 1.5 }}>{s.d}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Access / CTA ─────────────────────────────────────────────────────────────

function LandAccess() {
  return (
    <section className="land-sec">
      <LandHead center eyebrow="Dostęp dla Partnerów i kandydatów" title="Dołącz do Programu Partnerskiego ASD" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 38, maxWidth: 840, marginLeft: "auto", marginRight: "auto" }}>
        <div className="card" style={{ padding: 30 }}>
          <div className="land-ruleIcon" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}><Icon name="users" size={22} /></div>
          <h3 style={{ fontSize: 20, marginTop: 16 }}>Jestem Partnerem</h3>
          <p style={{ color: "var(--ink-2)", marginTop: 8, fontSize: 15, lineHeight: 1.55 }}>Masz konto w portalu — zaloguj się, aby zgłaszać i zarządzać projektami.</p>
          <Link href="/login" className="btn btn-brand" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 18, width: "100%", justifyContent: "center" }}>
            Zaloguj się do portalu
          </Link>
        </div>
        <div className="card" style={{ padding: 30 }}>
          <div className="land-ruleIcon" style={{ background: "var(--accent-soft)", color: "var(--accent-700)" }}><Icon name="sparkles" size={22} /></div>
          <h3 style={{ fontSize: 20, marginTop: 16 }}>Chcę zostać Partnerem</h3>
          <p style={{ color: "var(--ink-2)", marginTop: 8, fontSize: 15, lineHeight: 1.55 }}>Konto kandydata zakłada ASD Systems. Zostaw kontakt — odezwiemy się.</p>
          <a href="mailto:biuro@asdsystems.eu" className="btn btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 18, width: "100%", justifyContent: "center" }}>
            Skontaktuj się z ASD
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function LandFooter() {
  return (
    <footer style={{ borderTop: "1px solid var(--line)", marginTop: 40 }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <Logo width={100} />
        <div style={{ color: "var(--ink-3)", fontSize: 13.5 }}>ASD Partner Portal · Rejestr Projektów Partnerskich · © {new Date().getFullYear()}</div>
      </div>
    </footer>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function LandHead({ eyebrow, title, center, inline }: { eyebrow: string; title: string; center?: boolean; inline?: boolean }) {
  return (
    <div style={{ textAlign: center ? "center" : "left", maxWidth: center ? 640 : "none", margin: center ? "0 auto" : 0 }}>
      <div className="land-eyebrow" style={{ display: "inline-flex" }}><Icon name="grid" size={14} />{eyebrow}</div>
      <h2 style={{ fontSize: inline ? 28 : 34, marginTop: 14, lineHeight: 1.12, letterSpacing: "-.02em" }}>{title}</h2>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <LandHeader />
      <LandHero />
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 28px" }}>
        <LandSteps />
        <LandBenefits />
        <LandRules />
        <LandDuration />
        <LandHow />
        <LandAccess />
      </div>
      <LandFooter />
    </div>
  );
}
