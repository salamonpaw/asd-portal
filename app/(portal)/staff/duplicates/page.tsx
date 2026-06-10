import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHead, EmptyState, Badge } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";

function fmtDate(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });
}

export default async function StaffDuplicatesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const repId = session.user.repId;
  if (!repId) redirect("/login");

  const dups = await db.project.findMany({
    where: { repId, status: "DUP" },
    include: { partner: true },
    orderBy: { createdAt: "desc" },
  });

  const conflictIds = dups.map((d) => d.conflictsWith).filter(Boolean) as string[];
  const conflicts = conflictIds.length
    ? await db.project.findMany({ where: { id: { in: conflictIds } }, include: { partner: true } })
    : [];

  return (
    <div className="fadeup">
      <PageHead title="Duplikaty i konflikty" sub="Zgłoszenia na NIP, który ma już aktywny projekt." />

      {dups.length === 0 ? (
        <div className="card" style={{ padding: 8 }}>
          <EmptyState title="Brak konfliktów" sub="Żadne zgłoszenie nie koliduje z aktywnym projektem." icon="checkCircle" />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {dups.map((p) => {
            const conflict = conflicts.find((c) => c.id === p.conflictsWith) ??
              conflicts.find((c) => c.customerTaxId === p.customerTaxId);
            return (
              <div key={p.id} className="card" style={{ padding: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--dup)", marginBottom: 14 }}>
                  <Icon name="copy" size={18} />
                  <strong>Konflikt NIP <span className="mono">{p.customerTaxId}</span></strong>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 14, alignItems: "center" }}>
                  <Link href={`/staff/projects/${p.id}`} className="dup-side" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                    <span className="badge st-dup" style={{ marginBottom: 8 }}>Nowe zgłoszenie</span>
                    <div style={{ fontWeight: 600 }}>{p.partner.name}</div>
                    <div style={{ fontSize: 13, color: "var(--ink-2)" }}>„{p.customerName}"</div>
                    <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 4 }}>Zgłoszono {fmtDate(p.createdAt)}</div>
                  </Link>
                  <Icon name="x" size={20} style={{ color: "var(--ink-4)" }} />
                  {conflict ? (
                    <Link href={`/staff/projects/${conflict.id}`} className="dup-side" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                      <span className="badge st-active" style={{ marginBottom: 8 }}>Chroniony</span>
                      <div style={{ fontWeight: 600 }}>{conflict.partner.name}</div>
                      <div style={{ fontSize: 13, color: "var(--ink-2)" }}>„{conflict.customerName}"</div>
                      <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 4 }}>Ochrona do {fmtDate(conflict.expiresAt)}</div>
                    </Link>
                  ) : <div className="dup-side" style={{ color: "var(--ink-3)" }}>—</div>}
                </div>
                <div style={{ display: "flex", gap: 9, marginTop: 16, justifyContent: "flex-end" }}>
                  <Link href={`/staff/projects/${p.id}`} className="btn btn-ghost btn-sm">Rozpatrz zgłoszenie</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
