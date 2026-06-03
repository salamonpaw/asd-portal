"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHead, StatCard, SectionCard, EmptyState, Avatar, KV } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { ProjectsTable } from "@/components/portal/ProjectsTable";
import type { Partner, Project, Rep, Market } from "@prisma/client";

type ProjectWithHistory = Project & { history: { date: Date; who: string; text: string }[] };

function enrich(p: Project) {
  const today = new Date("2026-06-03");
  const daysLeft = p.expiresAt ? Math.round((p.expiresAt.getTime() - today.getTime()) / 86400000) : null;
  const isActive = p.status === "ACTIVE" || p.status === "NOPROT";
  const expiringSoon = isActive && daysLeft !== null && daysLeft <= 30 && daysLeft >= 0;
  return { ...p, daysLeft, isActive, expiringSoon };
}

export function PartnerDashboardClient({
  partner, projects, rep,
}: {
  partner: Partner & { markets: Market[] };
  projects: ProjectWithHistory[];
  rep: Rep | null;
}) {
  const router = useRouter();
  const enriched = projects.map(enrich);
  const active = enriched.filter((p) => p.isActive);
  const pending = enriched.filter((p) => ["VERIFY", "NEEDINFO", "DUP", "NEW"].includes(p.status));
  const expiring = active.filter((p) => p.expiringSoon);
  const expired = enriched.filter((p) => p.status === "EXPIRED");
  const attention = enriched.filter((p) => ["NEEDINFO", "DUP"].includes(p.status) || p.expiringSoon);
  const recent = [...enriched].slice(0, 5);

  return (
    <div className="fadeup">
      <PageHead
        title={`Dzień dobry, ${partner.contact.split(" ")[0]}`}
        sub={`${partner.name} · poziom ${partner.level} · rabat ${partner.discount}%`}
      >
        <Link href="/partner/projects/new" className="btn btn-primary">
          <Icon name="plus" size={16} />Nowe zgłoszenie
        </Link>
      </PageHead>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        <StatCard icon="shieldCheck" label="Projekty aktywne" value={active.length} tone="var(--ok)" soft="var(--ok-soft)" onClick={() => router.push("/partner/projects?tab=active")} />
        <StatCard icon="clock" label="Do akceptacji" value={pending.length} tone="var(--warn)" soft="var(--warn-soft)" onClick={() => router.push("/partner/projects?tab=pending")} />
        <StatCard icon="alert" label="Wygasają w 30 dni" value={expiring.length} tone="var(--accent)" soft="var(--accent-soft)" onClick={() => router.push("/partner/projects?tab=expiring")} />
        <StatCard icon="layers" label="Wygasłe" value={expired.length} tone="var(--expired)" soft="var(--expired-soft)" onClick={() => router.push("/partner/projects?tab=expired")} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, marginTop: 20, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {attention.length > 0 && (
            <SectionCard title="Wymaga Twojej uwagi" pad={false}>
              <div>
                {attention.map((p) => (
                  <div key={p.id} onClick={() => router.push(`/partner/projects/${p.id}`)} className="attn-row">
                    <div style={{ width: 36, height: 36, borderRadius: 9, flex: "none", display: "flex", alignItems: "center", justifyContent: "center",
                      background: p.status === "DUP" ? "var(--dup-soft)" : p.status === "NEEDINFO" ? "#FBEEDB" : "var(--accent-soft)",
                      color: p.status === "DUP" ? "var(--dup)" : p.status === "NEEDINFO" ? "#92590a" : "var(--accent-700)" }}>
                      <Icon name={p.status === "DUP" ? "copy" : p.status === "NEEDINFO" ? "info" : "clock"} size={18} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{p.customerName}</div>
                      <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
                        {p.status === "DUP" ? "Możliwy duplikat – w weryfikacji ASD"
                          : p.status === "NEEDINFO" ? "ASD prosi o uzupełnienie danych"
                          : `Ochrona wygasa za ${p.daysLeft} dni`}
                      </div>
                    </div>
                    <Icon name="chevronRight" size={17} style={{ color: "var(--ink-4)" }} />
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          <SectionCard title="Ostatnie projekty" pad={false} action={<Link href="/partner/projects" className="btn btn-ghost btn-sm">Wszystkie</Link>}>
            <div style={{ padding: "4px 8px" }}>
              {recent.length ? <ProjectsTable projects={recent} /> : <EmptyState />}
            </div>
          </SectionCard>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card" style={{ padding: 20, background: "linear-gradient(165deg, var(--brand), var(--brand-900))", color: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12.5, opacity: .8, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>Poziom rabatowy</span>
              <Icon name="award" size={20} style={{ opacity: .9 }} />
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 30, marginTop: 14 }}>Partner {partner.level}</div>
            <div style={{ fontSize: 38, fontFamily: "var(--font-display)", fontWeight: 600, marginTop: 6 }}>{partner.discount}<span style={{ fontSize: 20, opacity: .8 }}>% rabatu</span></div>
          </div>

          {rep && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 12 }}>Twój Handlowiec ASD</div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Avatar initials={rep.initials} size={42} color="var(--accent)" />
                <div>
                  <div style={{ fontWeight: 600 }}>{rep.name}</div>
                  <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{rep.region}</div>
                </div>
              </div>
              <div style={{ marginTop: 14 }}>
                <a className="btn btn-soft btn-sm" style={{ width: "100%" }} href={`mailto:${rep.email}`}>
                  <Icon name="mail" size={15} />E-mail
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
