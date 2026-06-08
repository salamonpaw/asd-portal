"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHead, FilterTabs, EmptyState } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { ProjectsTable } from "@/components/portal/ProjectsTable";
import { daysUntil } from "@/lib/dates";
import { exportProjectsToExcel } from "@/lib/export";
import type { Partner, Project, Rep } from "@prisma/client";

type ProjectWithPartner = Project & { partner: Partner; rep: Rep };

export function StaffProjectsClient({ projects }: { projects: ProjectWithPartner[] }) {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("tab") ?? "queue");
  const [q, setQ] = useState("");

  const enriched = projects.map((p) => {
    const dl = daysUntil(p.expiresAt);
    const isActive = p.status === "ACTIVE" || p.status === "NOPROT";
    const expiringSoon = isActive && dl !== null && dl <= 30 && dl >= 0;
    return { ...p, isActive, expiringSoon, partnerShort: p.partner.short };
  });

  const filters: Record<string, (p: typeof enriched[0]) => boolean> = {
    all: () => true,
    queue: (p) => ["VERIFY", "NEW", "DUP"].includes(p.status),
    active: (p) => p.isActive,
    expiring: (p) => p.expiringSoon,
    waiting: (p) => p.status === "NEEDINFO",
    closed: (p) => ["WON", "LOST", "REJECT", "DEACT", "EXPIRED"].includes(p.status),
  };

  const tabs = [
    { key: "queue", label: "Do weryfikacji", count: enriched.filter(filters.queue).length },
    { key: "active", label: "Aktywne", count: enriched.filter(filters.active).length },
    { key: "expiring", label: "Wygasające", count: enriched.filter(filters.expiring).length },
    { key: "waiting", label: "Czeka na Partnera", count: enriched.filter(filters.waiting).length },
    { key: "closed", label: "Zamknięte", count: enriched.filter(filters.closed).length },
    { key: "all", label: "Wszystkie", count: enriched.length },
  ];

  const list = enriched
    .filter(filters[tab] ?? filters.all)
    .filter((p) => !q || p.customerName.toLowerCase().includes(q.toLowerCase()) || p.customerTaxId.includes(q) || p.partner.name.toLowerCase().includes(q.toLowerCase()) || p.id.includes(q));

  return (
    <div className="fadeup">
      <PageHead
        title="Projekty Partnerów"
        sub="Zgłoszenia przypisanych Ci Partnerów."
      >
        <button
          className="btn btn-soft"
          onClick={() => exportProjectsToExcel(projects)}
          title="Eksportuj wszystkie projekty do Excel"
        >
          <Icon name="download" size={16} />Excel
        </button>
      </PageHead>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
        <FilterTabs tabs={tabs} active={tab} onChange={setTab} />
        <div className="searchbox">
          <Icon name="search" size={16} />
          <input placeholder="Szukaj klienta, Partnera, NIP…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <div className="card"><div style={{ padding: "6px 10px" }}>
        {list.length
          ? <ProjectsTable projects={list} showPartnerName basePath="/staff/projects" />
          : <EmptyState title="Brak projektów" sub="Zmień filtr." />}
      </div></div>
    </div>
  );
}
