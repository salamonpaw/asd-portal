"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHead, StatCard, SectionCard, EmptyState, Avatar } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui";
import type { Partner, Project, Rep } from "@prisma/client";

type ProjectWithPartner = Project & { partner: Partner };

function levelColor(level: string) {
  return ({ STANDARD: "#8A8F99", BRONZE: "#A9712F", SILVER: "#7C8893", GOLD: "#C99A2E", STRATEGIC: "var(--brand)" } as any)[level] ?? "var(--brand)";
}

function fmtDate(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });
}

export function StaffDashboardClient({ rep, projects, partners }: {
  rep: Rep;
  projects: ProjectWithPartner[];
  partners: Partner[];
}) {
  const router = useRouter();
  const today = new Date("2026-06-03");

  const queue = projects.filter((p) => ["VERIFY", "NEW", "DUP"].includes(p.status));
  const active = projects.filter((p) => p.status === "ACTIVE" || p.status === "NOPROT");
  const dups = projects.filter((p) => p.status === "DUP");
  const expiring = active.filter((p) => {
    if (!p.expiresAt) return false;
    const d = Math.round((p.expiresAt.getTime() - today.getTime()) / 86400000);
    return d <= 30 && d >= 0;
  });

  return (
    <div className="fadeup">
      <PageHead
        title={`Pulpit – ${rep.name.split(" ")[0]}`}
        sub={`${rep.region} · ${partners.length} Partnerów · ${queue.length} zgłoszeń do weryfikacji`}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        <StatCard icon="clock" label="Do weryfikacji" value={queue.length} tone="var(--warn)" soft="var(--warn-soft)" onClick={() => router.push("/staff/projects?tab=queue")} />
        <StatCard icon="shieldCheck" label="Aktywne projekty" value={active.length} tone="var(--ok)" soft="var(--ok-soft)" onClick={() => router.push("/staff/projects?tab=active")} />
        <StatCard icon="copy" label="Duplikaty / konflikty" value={dups.length} tone="var(--dup)" soft="var(--dup-soft)" onClick={() => router.push("/staff/duplicates")} />
        <StatCard icon="alert" label="Wygasają w 30 dni" value={expiring.length} tone="var(--accent)" soft="var(--accent-soft)" onClick={() => router.push("/staff/projects?tab=expiring")} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, marginTop: 20, alignItems: "start" }}>
        <SectionCard title="Zgłoszenia do weryfikacji" pad={false} action={<Link href="/staff/projects?tab=queue" className="btn btn-ghost btn-sm">Wszystkie</Link>}>
          {queue.length === 0 ? (
            <div style={{ padding: 8 }}><EmptyState title="Brak nowych zgłoszeń" sub="Wszystko zweryfikowane – dobra robota." icon="checkCircle" /></div>
          ) : (
            <div>
              {queue.slice(0, 8).map((p) => (
                <div key={p.id} className="queue-row">
                  <div onClick={() => router.push(`/staff/projects/${p.id}`)} style={{ flex: 1, minWidth: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 13 }}>
                    <Avatar initials={p.partner.short.slice(0, 2).toUpperCase()} size={38} color={p.status === "DUP" ? "var(--dup)" : "var(--brand)"} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{p.customerName}</span>
                        {p.procurement === "PRZETARG" && <span className="badge st-noprot" style={{ padding: "2px 8px", fontSize: 11 }}><Icon name="flag" size={11} />Przetarg</span>}
                        {p.status === "DUP" && <span className="badge st-dup" style={{ padding: "2px 8px", fontSize: 11 }}>Duplikat</span>}
                      </div>
                      <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{p.partner.short} · {p.machines} aut. · <span className="mono">{p.customerTaxId}</span></div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 7, flex: "none" }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => router.push(`/staff/projects/${p.id}`)}>Otwórz</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Moi Partnerzy" pad={false} action={<Link href="/staff/partners" className="btn btn-ghost btn-sm">Wszyscy</Link>}>
          <div>
            {partners.map((pt) => {
              const cnt = projects.filter((x) => x.partnerId === pt.id && (x.status === "ACTIVE" || x.status === "NOPROT")).length;
              return (
                <div key={pt.id} className="attn-row" onClick={() => router.push(`/staff/partners/${pt.id}`)}>
                  <Avatar initials={pt.short.slice(0, 2).toUpperCase()} size={36} color={levelColor(pt.level)} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, display: "flex", gap: 7, alignItems: "center" }}>
                      {pt.short}
                      {pt.candidate && <span className="badge st-new" style={{ fontSize: 10, padding: "1px 7px" }}>Kandydat</span>}
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{pt.level} · {cnt} aktywnych</div>
                  </div>
                  <Icon name="chevronRight" size={16} style={{ color: "var(--ink-4)" }} />
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
