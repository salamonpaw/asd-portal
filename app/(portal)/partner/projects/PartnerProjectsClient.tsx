"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHead, FilterTabs, EmptyState } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { ProjectsTable } from "@/components/portal/ProjectsTable";
import type { Project } from "@prisma/client";

const today = new Date("2026-06-03");

function daysLeft(d: Date | null) {
  if (!d) return null;
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

export function PartnerProjectsClient({ projects }: { projects: Project[] }) {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("tab") ?? "all");
  const [q, setQ] = useState("");

  const enriched = projects.map((p) => {
    const dl = daysLeft(p.expiresAt);
    const isActive = p.status === "ACTIVE" || p.status === "NOPROT";
    const expiringSoon = isActive && dl !== null && dl <= 30 && dl >= 0;
    return { ...p, isActive, expiringSoon };
  });

  const filters: Record<string, (p: typeof enriched[0]) => boolean> = {
    all: () => true,
    active: (p) => p.isActive,
    pending: (p) => ["VERIFY", "NEEDINFO", "DUP", "NEW"].includes(p.status),
    expiring: (p) => p.expiringSoon,
    expired: (p) => p.status === "EXPIRED",
    closed: (p) => ["WON", "LOST", "REJECT", "DEACT"].includes(p.status),
  };

  const tabs = [
    { key: "all", label: "Wszystkie", count: enriched.length },
    { key: "active", label: "Aktywne", count: enriched.filter(filters.active).length },
    { key: "pending", label: "Do weryfikacji", count: enriched.filter(filters.pending).length },
    { key: "expiring", label: "Wygasające", count: enriched.filter(filters.expiring).length },
    { key: "expired", label: "Wygasłe", count: enriched.filter(filters.expired).length },
    { key: "closed", label: "Zamknięte", count: enriched.filter(filters.closed).length },
  ];

  const list = enriched
    .filter(filters[tab] ?? filters.all)
    .filter((p) => !q || p.customerName.toLowerCase().includes(q.toLowerCase()) || p.customerTaxId.includes(q) || p.id.includes(q));

  return (
    <div className="fadeup">
      <PageHead title="Moje projekty" sub="Wszystkie zgłoszenia Twojej firmy i ich statusy.">
        <Link href="/partner/projects/new" className="btn btn-primary">
          <Icon name="plus" size={16} />Nowe zgłoszenie
        </Link>
      </PageHead>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
        <FilterTabs tabs={tabs} active={tab} onChange={setTab} />
        <div className="searchbox">
          <Icon name="search" size={16} />
          <input placeholder="Szukaj nazwy, NIP lub numeru…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="card"><div style={{ padding: "6px 10px" }}>
        {list.length ? (
          <ProjectsTable projects={list} />
        ) : (
          <EmptyState title="Brak projektów w tej kategorii" sub="Zmień filtr lub zgłoś nowy projekt.">
            <Link href="/partner/projects/new" className="btn btn-primary">
              <Icon name="plus" size={16} />Nowe zgłoszenie
            </Link>
          </EmptyState>
        )}
      </div></div>
    </div>
  );
}
