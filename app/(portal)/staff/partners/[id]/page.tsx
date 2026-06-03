import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { PageHead, Avatar, SectionCard, KV, EmptyState } from "@/components/ui";
import { ProjectsTable } from "@/components/portal/ProjectsTable";

function levelColor(level: string) {
  return ({ STANDARD: "#8A8F99", BRONZE: "#A9712F", SILVER: "#7C8893", GOLD: "#C99A2E", STRATEGIC: "var(--brand)" } as any)[level] ?? "var(--brand)";
}

function fmtMonth(s: string) {
  const [y, m] = s.split("-").map(Number);
  const months = ["sty","lut","mar","kwi","maj","cze","lip","sie","wrz","paź","lis","gru"];
  return `${months[m-1]} ${y}`;
}

export default async function StaffPartnerDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const partner = await db.partner.findUnique({
    where: { id: params.id },
    include: { markets: true, projects: { orderBy: { createdAt: "desc" } } },
  });

  if (!partner) notFound();

  return (
    <div className="fadeup">
      <Link href="/staff/partners" className="backlink">← Partnerzy</Link>
      <div style={{ display: "flex", gap: 16, alignItems: "center", margin: "14px 0 24px" }}>
        <Avatar initials={partner.short.slice(0, 2).toUpperCase()} size={54} color={levelColor(partner.level)} />
        <div>
          <h1 style={{ fontSize: 26 }}>{partner.name}</h1>
          <div style={{ fontSize: 14, color: "var(--ink-3)", marginTop: 3 }}>
            {partner.city}, {partner.country} · Partner {partner.level} · rabat {partner.discount}%{partner.candidate ? " · Kandydat" : ""}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>
        <SectionCard title={`Projekty (${partner.projects.length})`} pad={false}>
          <div style={{ padding: "6px 10px" }}>
            {partner.projects.length
              ? <ProjectsTable projects={partner.projects} />
              : <EmptyState />}
          </div>
        </SectionCard>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 13 }}>
            <KV label="Osoba kontaktowa">{partner.contact}</KV>
            <KV label="E-mail">{partner.email}</KV>
            <KV label="Telefon">{partner.phone}</KV>
            <KV label="Partner od">{fmtMonth(partner.since)}</KV>
          </div>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".04em", fontWeight: 600, marginBottom: 10 }}>Rynki</div>
            <div className="chips">
              {partner.markets.map((m) => (
                <span key={m.id} className="badge st-new">{m.name}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
