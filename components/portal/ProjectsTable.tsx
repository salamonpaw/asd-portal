"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import type { Project } from "@prisma/client";

function fmtDate(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });
}

function daysLeft(d: Date | null) {
  if (!d) return null;
  return Math.round((d.getTime() - new Date("2026-06-03").getTime()) / 86400000);
}

export function ProjectsTable({ projects, showPartnerName }: { projects: (Project & { partnerShort?: string })[]; showPartnerName?: boolean }) {
  const router = useRouter();

  const getHref = (p: Project) => {
    return p.partnerId ? `/staff/projects/${p.id}` : `/partner/projects/${p.id}`;
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="ptable">
        <thead>
          <tr>
            <th>Projekt</th>
            <th>Klient końcowy</th>
            {showPartnerName && <th>Partner</th>}
            <th>Automaty</th>
            <th>Status</th>
            <th>Ochrona do</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => {
            const dl = daysLeft(p.expiresAt);
            const expiringSoon = (p.status === "ACTIVE" || p.status === "NOPROT") && dl !== null && dl <= 30 && dl >= 0;
            return (
              <tr key={p.id} onClick={() => router.push(`/partner/projects/${p.id}`)}>
                <td><span className="mono" style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{p.id.replace("ASD-PRJ-", "")}</span></td>
                <td>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{p.customerName}</div>
                  <div className="mono" style={{ fontSize: 12, color: "var(--ink-3)" }}>NIP {p.customerTaxId}{p.location ? ` · ${p.location}` : ""}</div>
                </td>
                {showPartnerName && <td><span style={{ fontSize: 13.5 }}>{p.partnerShort}</span></td>}
                <td><span style={{ fontSize: 13.5 }}>{p.machines}</span></td>
                <td><Badge status={p.status} /></td>
                <td>
                  {p.expiresAt ? (
                    <span style={{ fontSize: 13, color: expiringSoon ? "var(--warn)" : "var(--ink-2)", fontWeight: expiringSoon ? 600 : 400 }}>
                      {fmtDate(p.expiresAt)}{expiringSoon && dl !== null ? ` · ${dl} dni` : ""}
                    </span>
                  ) : <span style={{ color: "var(--ink-4)" }}>—</span>}
                </td>
                <td><Icon name="chevronRight" size={17} style={{ color: "var(--ink-4)" }} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
