import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHead, Avatar } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";

const LEVEL_COLOR: Record<string, string> = {
  STANDARD: "#8A8F99", BRONZE: "#A9712F", SILVER: "#7C8893", GOLD: "#C99A2E", STRATEGIC: "var(--brand)",
};

export default async function AdminPartnersPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const partners = await db.partner.findMany({
    include: { rep: true, markets: true, _count: { select: { projects: true, users: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="fadeup">
      <PageHead title="Partnerzy" sub="Zarządzaj firmami partnerskimi i kandydatami.">
        <Link href="/admin/partners/new" className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Icon name="plus" size={16} />Nowy Partner
        </Link>
      </PageHead>

      <div className="card">
        <table className="ptable">
          <thead>
            <tr>
              <th>Partner</th>
              <th>Poziom</th>
              <th>Rabat</th>
              <th>Handlowiec</th>
              <th>Rynki</th>
              <th>Projekty</th>
              <th>Użytkownicy</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {partners.map((p) => (
              <tr key={p.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar initials={p.short.slice(0, 2).toUpperCase()} size={32} color={LEVEL_COLOR[p.level] ?? "var(--brand)"} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{p.city}, {p.country}{p.candidate ? " · Kandydat" : ""}</div>
                    </div>
                  </div>
                </td>
                <td><span style={{ fontSize: 13, fontWeight: 600 }}>{p.level}</span></td>
                <td><span style={{ fontSize: 13 }}>{p.discount}%</span></td>
                <td><span style={{ fontSize: 13 }}>{p.rep.name}</span></td>
                <td><span style={{ fontSize: 12, color: "var(--ink-2)" }}>{p.markets.map((m) => m.name).join(", ")}</span></td>
                <td><span style={{ fontSize: 13 }}>{p._count.projects}</span></td>
                <td><span style={{ fontSize: 13 }}>{p._count.users}</span></td>
                <td>
                  <Link href={`/admin/partners/${p.id}`} className="btn btn-ghost btn-sm">
                    <Icon name="edit" size={14} />Edytuj
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
