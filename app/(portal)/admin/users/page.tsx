import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHead, Avatar, Badge } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";

const ROLE_LABEL: Record<string, string> = { PARTNER: "Partner", STAFF: "Handlowiec", ADMIN: "Admin" };
const ROLE_COLOR: Record<string, string> = { PARTNER: "var(--brand)", STAFF: "var(--accent)", ADMIN: "#6D4AA8" };

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") redirect("/login");

  const users = await db.user.findMany({
    include: { partner: true, rep: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="fadeup">
      <PageHead title="Użytkownicy" sub="Wszystkie konta w portalu.">
        <Link href="/admin/users/new" className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Icon name="plus" size={16} />Nowy użytkownik
        </Link>
      </PageHead>

      <div className="card">
        <table className="ptable">
          <thead>
            <tr>
              <th>Użytkownik</th>
              <th>E-mail</th>
              <th>Rola</th>
              <th>Powiązanie</th>
              <th>Data założenia</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const initials = u.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
              return (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar initials={initials} size={32} color={ROLE_COLOR[u.role] ?? "var(--brand)"} />
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</span>
                    </div>
                  </td>
                  <td><span className="mono" style={{ fontSize: 13 }}>{u.email}</span></td>
                  <td>
                    <span className="badge" style={{
                      background: u.role === "ADMIN" ? "var(--dup-soft)" : u.role === "STAFF" ? "var(--accent-soft)" : "var(--brand-soft)",
                      color: u.role === "ADMIN" ? "#543485" : u.role === "STAFF" ? "var(--accent-700)" : "var(--brand)",
                    }}>
                      {ROLE_LABEL[u.role]}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: "var(--ink-2)" }}>
                    {u.partner?.name ?? u.rep?.name ?? <span style={{ color: "var(--ink-4)" }}>—</span>}
                  </td>
                  <td style={{ fontSize: 13, color: "var(--ink-3)" }}>
                    {new Date(u.createdAt).toLocaleDateString("pl-PL")}
                  </td>
                  <td>
                    <Link href={`/admin/users/${u.id}`} className="btn btn-ghost btn-sm">
                      <Icon name="edit" size={14} />Edytuj
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
