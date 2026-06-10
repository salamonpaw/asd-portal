import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHead, Avatar } from "@/components/ui";

function levelColor(level: string) {
  return ({ STANDARD: "#8A8F99", BRONZE: "#A9712F", SILVER: "#7C8893", GOLD: "#C99A2E", STRATEGIC: "var(--brand)" } as any)[level] ?? "var(--brand)";
}

export default async function StaffPartnersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const repId = session.user.repId;
  if (!repId) redirect("/login");

  const partners = await db.partner.findMany({
    where: { repId },
    include: { projects: true },
  });

  return (
    <div className="fadeup">
      <PageHead title="Moi Partnerzy" sub="Partnerzy i kandydaci przypisani do Ciebie." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px,1fr))", gap: 16 }}>
        {partners.map((pt) => {
          const active = pt.projects.filter((p) => p.status === "ACTIVE" || p.status === "NOPROT").length;
          const pending = pt.projects.filter((p) => ["VERIFY", "NEW", "DUP"].includes(p.status)).length;
          return (
            <Link key={pt.id} href={`/staff/partners/${pt.id}`} style={{ textDecoration: "none" }}>
              <div className="card" style={{ padding: 20, cursor: "pointer" }}>
                <div style={{ display: "flex", gap: 13, alignItems: "center" }}>
                  <Avatar initials={pt.short.slice(0, 2).toUpperCase()} size={46} color={levelColor(pt.level)} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 16, fontFamily: "var(--font-display)", display: "flex", gap: 8, alignItems: "center" }}>
                      {pt.short}
                      {pt.candidate && <span className="badge st-new" style={{ fontSize: 10, padding: "1px 7px" }}>Kandydat</span>}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--ink-3)" }}>{pt.city} · Partner {pt.level} · rabat {pt.discount}%</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--line)", textAlign: "center" }}>
                  <div><div style={{ fontWeight: 600, fontSize: 20, fontFamily: "var(--font-display)" }}>{active}</div><div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>aktywne</div></div>
                  <div><div style={{ fontWeight: 600, fontSize: 20, fontFamily: "var(--font-display)", color: pending ? "var(--warn)" : "var(--ink)" }}>{pending}</div><div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>w kolejce</div></div>
                  <div><div style={{ fontWeight: 600, fontSize: 20, fontFamily: "var(--font-display)" }}>{pt.discount}%</div><div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>rabat</div></div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
