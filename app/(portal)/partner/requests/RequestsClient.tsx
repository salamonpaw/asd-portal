"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ProjectRequest } from "@prisma/client";
import { PageHead, EmptyState, FilterTabs, KV, Modal, Field } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { approveRequest, rejectRequest } from "@/lib/actions/partner-sales";
import { PROCUREMENT } from "@/lib/constants/project-form";

type Req = ProjectRequest & { salesRep: { name: string; email: string; phone: string | null } };

const STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Czeka na decyzję", cls: "st-verify" },
  APPROVED: { label: "Przekazane do ASD", cls: "st-active" },
  REJECTED: { label: "Odrzucone", cls: "st-reject" },
};

export function RequestsClient({ requests }: { requests: Req[] }) {
  const router = useRouter();
  const [tab, setTab] = useState("PENDING");
  const [busy, start] = useTransition();
  const [decide, setDecide] = useState<{ req: Req; mode: "approve" | "reject" } | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [flash, setFlash] = useState<{ text: string; projectId?: string } | null>(null);

  const counts = {
    PENDING: requests.filter((r) => r.status === "PENDING").length,
    APPROVED: requests.filter((r) => r.status === "APPROVED").length,
    REJECTED: requests.filter((r) => r.status === "REJECTED").length,
  };
  const list = requests.filter((r) => r.status === tab);

  function confirmDecision() {
    if (!decide) return;
    setError("");
    start(async () => {
      if (decide.mode === "approve") {
        const res = await approveRequest(decide.req.id, note);
        if (!res.success) return setError(res.error);
        setFlash({ text: `Zatwierdzono — projekt przekazany do ASD.`, projectId: res.data?.projectId });
      } else {
        const res = await rejectRequest(decide.req.id, note);
        if (!res.success) return setError(res.error);
        setFlash({ text: "Odrzucono zgłoszenie — handlowiec dostał informację." });
      }
      setDecide(null);
      setNote("");
      router.refresh();
    });
  }

  return (
    <div className="fadeup">
      <PageHead title="Zgłoszenia handlowców" sub="Zapotrzebowania od Twoich handlowców. Zatwierdzone trafiają do ASD jako nowe projekty." />

      {flash && (
        <div className="nip-note" style={{ marginBottom: 16, background: "var(--ok-soft)", color: "#14633f" }}>
          <Icon name="checkCircle" size={18} />
          <span>{flash.text} {flash.projectId && <Link href={`/partner/projects/${flash.projectId}`} style={{ fontWeight: 700 }}>Otwórz {flash.projectId} →</Link>}</span>
        </div>
      )}

      <FilterTabs
        active={tab}
        onChange={setTab}
        tabs={[
          { key: "PENDING", label: "Do decyzji", count: counts.PENDING },
          { key: "APPROVED", label: "Zatwierdzone", count: counts.APPROVED },
          { key: "REJECTED", label: "Odrzucone", count: counts.REJECTED },
        ]}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
        {list.length === 0 && (
          <div className="card"><EmptyState icon="send" title="Brak zgłoszeń" sub={tab === "PENDING" ? "Nic nie czeka na Twoją decyzję." : "Brak zgłoszeń w tej kategorii."} /></div>
        )}
        {list.map((r) => (
          <div key={r.id} className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16.5 }}>{r.customerName}</div>
                <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 3 }}>
                  <span className="mono">NIP {r.customerTaxId}</span> · {r.customerCountry}{r.location ? ` · ${r.location}` : ""}
                </div>
              </div>
              <span className={`badge ${STATUS[r.status]?.cls ?? ""}`}>{STATUS[r.status]?.label ?? r.status}</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginTop: 16 }}>
              <KV label="Handlowiec">{r.salesRep.name}<div style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 400 }}>{r.salesRep.email}{r.salesRep.phone ? ` · ${r.salesRep.phone}` : ""}</div></KV>
              <KV label="Automaty">{r.machines}</KV>
              <KV label="Postępowanie">{PROCUREMENT.find((p) => p.id === r.procurement)?.label ?? r.procurement}</KV>
              <KV label="Etap">{r.stage}</KV>
              <KV label="Termin decyzji">{r.decisionDate || "—"}</KV>
              <KV label="Zgłoszono">{new Date(r.createdAt).toLocaleDateString("pl-PL")}</KV>
            </div>

            <div style={{ marginTop: 14, fontSize: 14, lineHeight: 1.55, color: "var(--ink-2)", whiteSpace: "pre-wrap" }}>{r.description}</div>
            {r.support.length > 0 && <div className="chips" style={{ marginTop: 10 }}>{r.support.map((s) => <span key={s} className="badge st-new">{s}</span>)}</div>}
            {r.notes && <div style={{ marginTop: 10, fontSize: 13.5, color: "var(--ink-3)" }}><b>Uwagi:</b> {r.notes}</div>}
            {r.partnerNote && <div style={{ marginTop: 10, fontSize: 13.5, color: "var(--ink-3)" }}><b>Twój komentarz:</b> {r.partnerNote}</div>}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
              {r.status === "PENDING" ? (
                <>
                  <button className="btn btn-ghost" onClick={() => { setError(""); setNote(""); setDecide({ req: r, mode: "reject" }); }}>
                    <Icon name="x" size={15} />Odrzuć
                  </button>
                  <button className="btn btn-ok" onClick={() => { setError(""); setNote(""); setDecide({ req: r, mode: "approve" }); }}>
                    <Icon name="check" size={15} />Zatwierdź i przekaż do ASD
                  </button>
                </>
              ) : r.projectId ? (
                <Link className="btn btn-soft btn-sm" href={`/partner/projects/${r.projectId}`}>Projekt {r.projectId} →</Link>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!decide} onClose={() => setDecide(null)} width={480}>
        {decide && (
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
            <h3 style={{ fontSize: 19 }}>{decide.mode === "approve" ? "Zatwierdzić zgłoszenie?" : "Odrzucić zgłoszenie?"}</h3>
            <p style={{ color: "var(--ink-3)", fontSize: 14 }}>
              {decide.req.customerName} · od {decide.req.salesRep.name}.{" "}
              {decide.mode === "approve"
                ? "Powstanie projekt w Twoim panelu i trafi do weryfikacji ASD. Handlowiec zostanie przypisany do projektu (dostanie przypomnienia o terminach)."
                : "Handlowiec dostanie e-mail z powodem odrzucenia."}
            </p>
            <Field label={decide.mode === "approve" ? "Komentarz dla handlowca (opcjonalnie)" : "Powód odrzucenia"} req={decide.mode === "reject"}>
              <textarea className="textarea" style={{ minHeight: 70 }} value={note} onChange={(e) => setNote(e.target.value)} autoFocus />
            </Field>
            {error && <div style={{ color: "var(--danger)", fontSize: 13.5, fontWeight: 600 }}>{error}</div>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setDecide(null)}>Anuluj</button>
              <button className={`btn ${decide.mode === "approve" ? "btn-ok" : "btn-danger"}`} onClick={confirmDecision} disabled={busy}>
                {busy ? "Zapisywanie…" : decide.mode === "approve" ? "Zatwierdź" : "Odrzuć"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
