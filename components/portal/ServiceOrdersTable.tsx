"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ServiceOrderStatus } from "@prisma/client";
import { FilterTabs, EmptyState } from "@/components/ui";
import { OrderStatusBadge } from "@/components/portal/OrderStatusBadge";
import { fmtMoney } from "@/lib/pricing";

export type ServiceOrderRow = {
  id: string; code: string; status: ServiceOrderStatus; partner: string; technician: string;
  items: number; quantity: number; total: number | null; currency: string;
  neededDate: string | null; expectedDate: string | null; createdAt: string;
};

const TABS: { key: string; label: string; statuses: ServiceOrderStatus[] | null }[] = [
  { key: "todo", label: "Do obsługi", statuses: ["NOWE", "PRZYJĘTE"] },
  { key: "waiting", label: "Czeka na części", statuses: ["OCZEKUJE_NA_CZESCI"] },
  { key: "suspended", label: "Zawieszone", statuses: ["ZAWIESZONE"] },
  { key: "done", label: "Zrealizowane", statuses: ["ZREALIZOWANE", "CZĘŚCIOWO_ZREALIZOWANE"] },
  { key: "rejected", label: "Odrzucone", statuses: ["ODRZUCONE"] },
  { key: "all", label: "Wszystkie", statuses: null },
];

const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("pl-PL") : "—");

/** Lista zamówień części — wspólna dla magazynu i partnera. */
export function ServiceOrdersTable({ orders, basePath, showPartner = true, defaultTab = "todo" }: { orders: ServiceOrderRow[]; basePath: string; showPartner?: boolean; defaultTab?: string }) {
  const router = useRouter();
  const [tab, setTab] = useState(defaultTab);
  const [q, setQ] = useState("");

  const inTab = (r: ServiceOrderRow, key: string) => { const t = TABS.find((x) => x.key === key)!; return !t.statuses || t.statuses.includes(r.status); };
  const term = q.trim().toLowerCase();
  const list = orders.filter((r) => inTab(r, tab) && (!term || [r.code, r.partner, r.technician].some((s) => s.toLowerCase().includes(term))));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
        <FilterTabs active={tab} onChange={setTab} tabs={TABS.map((t) => ({ key: t.key, label: t.label, count: orders.filter((r) => inTab(r, t.key)).length }))} />
        <input className="input" style={{ maxWidth: 280 }} placeholder={showPartner ? "Szukaj: numer, partner, serwisant" : "Szukaj: numer, serwisant"} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="card" style={{ overflowX: "auto" }}>
        {list.length === 0 ? (
          <EmptyState icon="layers" title="Brak zamówień" sub="Nic w tej kategorii." />
        ) : (
          <table className="ptable">
            <thead>
              <tr><th>Numer</th><th>{showPartner ? "Partner / serwisant" : "Serwisant"}</th><th>Pozycje</th><th>Wartość</th><th>Potrzebne do</th><th>Status</th><th>Utworzone</th></tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} onClick={() => router.push(`${basePath}/${r.id}`)}>
                  <td className="mono" style={{ fontWeight: 600 }}>{r.code}</td>
                  <td>{showPartner ? <><div style={{ fontWeight: 600 }}>{r.partner}</div><div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{r.technician}</div></> : <span style={{ fontWeight: 600 }}>{r.technician}</span>}</td>
                  <td>{r.items} poz. · {r.quantity} szt.</td>
                  <td style={{ whiteSpace: "nowrap" }}>{r.total === null ? <span style={{ color: "#845509" }}>do wyceny</span> : fmtMoney(r.total, r.currency)}</td>
                  <td>{fmtDate(r.neededDate)}</td>
                  <td><OrderStatusBadge status={r.status} expectedDate={r.expectedDate} /></td>
                  <td style={{ color: "var(--ink-3)" }}>{fmtDate(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
