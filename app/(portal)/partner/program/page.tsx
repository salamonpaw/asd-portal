import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { PageHead, SectionCard } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";

const LEVEL_COLOR: Record<string, string> = {
  STANDARD: "#8A8F99", BRONZE: "#A9712F", SILVER: "#7C8893", GOLD: "#C99A2E", STRATEGIC: "var(--brand)",
};

const LEVELS = [
  { name: "Bronze",   disc: "5%",           need: "Wejście do programu" },
  { name: "Silver",   disc: "8%",           need: "Min. 5 zaakceptowanych projektów / rok" },
  { name: "Gold",     disc: "12%",          need: "Min. 15 projektów + konwersja > 30%" },
  { name: "Strategic",disc: "indywidualnie",need: "Na zaproszenie ASD Systems" },
];

const SCORING = [
  "Liczba zaakceptowanych projektów",
  "Konwersja projektów na sprzedaż",
  "Terminowe aktualizowanie projektów",
  "Udział w szkoleniach i certyfikacjach",
  "Wolumen sprzedaży automatów ASD",
  "Rozwój nowych rynków i segmentów",
];

export default async function PartnerProgramPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const partnerId = session.user.partnerId;
  const partner = partnerId ? await db.partner.findUnique({ where: { id: partnerId } }) : null;
  const currentLevel = partner?.level ?? "BRONZE";

  return (
    <div className="fadeup" style={{ maxWidth: 920 }}>
      <PageHead title="Program Partnerski" sub="Zgłaszanie projektów to jeden z elementów budowania Twojego statusu." />

      <SectionCard title="Poziomy rabatowe" style={{ marginBottom: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          {LEVELS.map((l) => {
            const isCurrent = l.name.toUpperCase() === currentLevel;
            return (
              <div key={l.name} style={{ border: `1.5px solid ${isCurrent ? LEVEL_COLOR[l.name.toUpperCase()] : "var(--line)"}`, borderRadius: "var(--r)", padding: 16, background: isCurrent ? "var(--surface-2)" : "var(--surface)", position: "relative" }}>
                {isCurrent && (
                  <span className="badge" style={{ position: "absolute", top: -11, right: 12, background: LEVEL_COLOR[l.name.toUpperCase()], color: "#fff", fontSize: 11 }}>
                    Twój poziom
                  </span>
                )}
                <div style={{ width: 36, height: 36, borderRadius: 10, background: LEVEL_COLOR[l.name.toUpperCase()], color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                  <Icon name="award" size={18} />
                </div>
                <div style={{ fontWeight: 600, fontFamily: "var(--font-display)", fontSize: 16 }}>{l.name}</div>
                <div style={{ fontSize: 22, fontWeight: 600, fontFamily: "var(--font-display)", color: LEVEL_COLOR[l.name.toUpperCase()], marginTop: 2 }}>{l.disc}</div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 8, lineHeight: 1.4 }}>{l.need}</div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Za co zdobywasz punkty">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {SCORING.map((s) => (
            <div key={s} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14.5, color: "var(--ink-2)" }}>
              <Icon name="check" size={17} style={{ color: "var(--ok)", flex: "none" }} />{s}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: 14, borderRadius: "var(--r-sm)", background: "var(--brand-soft)", color: "var(--brand)", fontSize: 13.5, display: "flex", gap: 9, alignItems: "center" }}>
          <Icon name="info" size={17} />Automatyczny scoring uruchomimy w kolejnym etapie. Obecnie poziom ustala Twój Handlowiec ASD.
        </div>
      </SectionCard>
    </div>
  );
}
