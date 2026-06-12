import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { PageHead, SectionCard, KV } from "@/components/ui";
import { ChangePasswordCard } from "@/components/portal/ChangePasswordCard";
import { UserProfileEditCard } from "@/components/portal/UserProfileEditCard";
import { Icon } from "@/components/ui/Icon";

const LEVEL_COLOR: Record<string, string> = {
  STANDARD: "#8A8F99", BRONZE: "#A9712F", SILVER: "#7C8893", GOLD: "#C99A2E", STRATEGIC: "var(--brand)",
};

function fmtMonth(s: string) {
  const [y, m] = s.split("-").map(Number);
  const months = ["sty","lut","mar","kwi","maj","cze","lip","sie","wrz","paź","lis","gru"];
  return `${months[m-1]} ${y}`;
}

export default async function PartnerProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const partnerId = session.user.partnerId;
  if (!partnerId) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });
  if (!user) redirect("/login");

  const partner = await db.partner.findUnique({
    where: { id: partnerId },
    include: { markets: true },
  });
  if (!partner) redirect("/login");

  return (
    <div className="fadeup" style={{ maxWidth: 820 }}>
      <PageHead title="Mój profil" sub="Dane Twojej firmy w Programie Partnerskim ASD." />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <SectionCard title="Dane firmy">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <KV label="Nazwa">{partner.name}</KV>
            <KV label="Siedziba">{partner.city}, {partner.country}</KV>
            <KV label="Osoba kontaktowa">{partner.contact}</KV>
            <KV label="E-mail">{partner.email}</KV>
            <KV label="Telefon">{partner.phone}</KV>
            <KV label="Partner od">{fmtMonth(partner.since)}</KV>
          </div>
        </SectionCard>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <SectionCard title="Rynki, na których działasz">
            <div className="chips">
              {partner.markets.map((m) => (
                <span key={m.id} className="badge st-new"><Icon name="globe" size={13} />{m.name}</span>
              ))}
            </div>
            <p style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 12 }}>
              Projekty możesz zgłaszać dla klientów z przypisanych rynków. Rozszerzenie zasięgu zgłoś u Handlowca.
            </p>
          </SectionCard>

          <SectionCard title="Status w programie">
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: LEVEL_COLOR[partner.level] ?? "var(--brand)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="award" size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 18, fontFamily: "var(--font-display)" }}>Partner {partner.level}</div>
                <div style={{ fontSize: 13.5, color: "var(--ink-2)" }}>Rabat bazowy {partner.discount}%</div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <UserProfileEditCard initialName={user.name} initialEmail={user.email} />
        <ChangePasswordCard />
      </div>
    </div>
  );
}
