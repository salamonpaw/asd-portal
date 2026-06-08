"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, KV, SectionCard, Modal, Field, Avatar, Timeline } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { fmtDate, daysUntil } from "@/lib/dates";
import type { Comment, Market, Partner, Project, ProjectHistory, Rep, User } from "@prisma/client";

type FullProject = Project & {
  partner: Partner & { markets: Market[] };
  rep: Rep;
  history: ProjectHistory[];
  comments: (Comment & { user: User })[];
};

const PROCUREMENT_LABELS: Record<string, string> = { BIEZACA: "Bieżąca sprzedaż", ZAPYTANIE: "Zapytanie ofertowe", PRZETARG: "Przetarg" };

export function ProjectDetailClient({ project: initial, conflict, isStaff, backHref }: {
  project: FullProject;
  conflict: (Project & { partner: Partner }) | null;
  isStaff: boolean;
  backHref: string;
}) {
  const router = useRouter();
  const [project, setProject] = useState(initial);
  const [modal, setModal] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const dl = daysUntil(project.expiresAt);
  const isActive = project.status === "ACTIVE" || project.status === "NOPROT";
  const expiringSoon = isActive && dl !== null && dl <= 30 && dl >= 0;
  const isPending = ["VERIFY", "NEW", "DUP", "NEEDINFO"].includes(project.status);

  async function action(endpoint: string, body: object) {
    setLoading(true);
    const res = await fetch(`/api/projects/${project.id}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const updated = await res.json();
      setProject(updated);
    }
    setLoading(false);
    setModal(null);
  }

  async function addComment() {
    if (!comment.trim()) return;
    await action("comment", { text: comment.trim() });
    setComment("");
  }

  return (
    <div className="fadeup">
      <Link href={backHref} className="backlink"><Icon name="arrowLeft" size={16} />Wróć</Link>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", margin: "14px 0 24px" }}>
        <div>
          <div className="mono" style={{ fontSize: 13, color: "var(--ink-3)" }}>{project.id}</div>
          <h1 style={{ fontSize: 27, marginTop: 4 }}>{project.customerName}</h1>
          <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center" }}>
            <Badge status={project.status} />
            {project.procurement === "PRZETARG" && <span className="badge st-noprot"><Icon name="flag" size={13} />Przetarg</span>}
            {expiringSoon && <span className="badge st-needinfo"><Icon name="clock" size={13} />Wygasa za {dl} dni</span>}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 22, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
          {/* Protection bar */}
          {isActive && (
            <div style={{ padding: 18, borderRadius: "var(--r)", background: project.status === "ACTIVE" ? "var(--ok-soft)" : "var(--info-soft)", border: `1px solid ${project.status === "ACTIVE" ? "rgba(30,138,90,.25)" : "var(--line)"}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: project.status === "ACTIVE" ? "#14633f" : "var(--info)" }}>
                <Icon name={project.status === "ACTIVE" ? "shieldCheck" : "shieldOff"} size={20} />
                <strong style={{ fontSize: 14.5 }}>{project.status === "ACTIVE" ? "Relacja chroniona" : "Aktywny – bez ochrony partnerskiej"}</strong>
              </div>
              {project.expiresAt && (
                <>
                  <div style={{ height: 7, borderRadius: 99, background: "rgba(0,0,0,.07)", marginTop: 14, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.max(0, Math.min(1, (dl ?? 0) / 92)) * 100}%`, background: project.status === "ACTIVE" ? "var(--ok)" : "var(--info)", borderRadius: 99 }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 9, fontSize: 12.5, color: "var(--ink-2)" }}>
                    <span>{dl !== null && dl >= 0 ? `Pozostało ${dl} dni` : "Wygasł"}</span>
                    <span>do {fmtDate(project.expiresAt)}</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* needinfo message */}
          {project.status === "NEEDINFO" && !isStaff && project.comments.length > 0 && (
            <div style={{ padding: 16, borderRadius: "var(--r)", background: "#FBEEDB", border: "1px solid #efd9ab" }}>
              <div style={{ fontWeight: 600, color: "#92590a", fontSize: 13.5, display: "flex", gap: 8, alignItems: "center" }}><Icon name="info" size={16} />Wiadomość od ASD Systems</div>
              <p style={{ marginTop: 7, color: "var(--ink-2)", fontSize: 14 }}>{project.comments[project.comments.length - 1].text}</p>
            </div>
          )}

          {/* duplicate panel */}
          {isStaff && project.status === "DUP" && conflict && (
            <div style={{ padding: 18, borderRadius: "var(--r)", background: "var(--dup-soft)", border: "1px solid #d3c2ee" }}>
              <div style={{ fontWeight: 600, color: "var(--dup)", display: "flex", gap: 8, alignItems: "center" }}><Icon name="copy" size={18} />Konflikt – ten NIP ma już aktywny projekt</div>
              <div className="card" style={{ marginTop: 12, padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div className="mono" style={{ fontSize: 12, color: "var(--ink-3)" }}>{conflict.id}</div>
                  <div style={{ fontWeight: 600 }}>{conflict.partner.short}</div>
                  <div style={{ fontSize: 13, color: "var(--ink-2)" }}>Ochrona do {fmtDate(conflict.expiresAt)}</div>
                </div>
                <Badge status={conflict.status} />
              </div>
            </div>
          )}

          <SectionCard title="Klient końcowy">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              <KV label="Nazwa">{project.customerName}</KV>
              <div>
                <div style={{ fontSize: 11.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".04em", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>NIP / Tax ID <Icon name="lock" size={12} style={{ color: "var(--ink-4)" }} /></div>
                <div className="mono" style={{ fontSize: 14.5, marginTop: 4, fontWeight: 600 }}>{project.customerTaxId} <span style={{ fontWeight: 400, color: "var(--ink-4)", fontSize: 12 }}>· {project.customerCountry}</span></div>
              </div>
              <KV label="Lokalizacja">{project.location || "—"}</KV>
              <KV label="Oddział">{project.branch || "—"}</KV>
            </div>
          </SectionCard>

          <SectionCard title="Dane projektu">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>
              <KV label="Szacowana liczba automatów">{project.machines}</KV>
              <KV label="Typ postępowania">{PROCUREMENT_LABELS[project.procurement]}</KV>
              <KV label="Etap rozmów">{project.stage}</KV>
              <KV label="Planowany termin decyzji">{project.decisionDate || "—"}</KV>
              <KV label="Zainteresowanie ASD">{project.interested ? "Tak" : "Nie"}</KV>
              <KV label="Oczekuje wsparcia ASD">{project.wantsSupport ? "Tak" : "Nie"}</KV>
            </div>
            <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--line)" }}>
              <KV label="Opis potrzeby klienta"><span style={{ fontWeight: 400, lineHeight: 1.6 }}>{project.description}</span></KV>
            </div>
            {project.support.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".04em", fontWeight: 600, marginBottom: 8 }}>Zakres wsparcia ASD</div>
                <div className="chips">{project.support.map((s) => <span key={s} className="badge st-new">{s}</span>)}</div>
              </div>
            )}
            {project.notes && <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)" }}><KV label="Uwagi Partnera"><span style={{ fontWeight: 400 }}>{project.notes}</span></KV></div>}
          </SectionCard>

          <SectionCard title="Historia projektu">
            <Timeline items={project.history.map((h) => ({ date: fmtDate(h.date), who: h.who, text: h.text }))} />
          </SectionCard>

          {isStaff && (
            <SectionCard title="Komentarze wewnętrzne ASD">
              {project.comments.length === 0 && <div style={{ color: "var(--ink-3)", fontSize: 14 }}>Brak komentarzy.</div>}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {project.comments.map((c, i) => (
                  <div key={i} style={{ display: "flex", gap: 12 }}>
                    <Avatar initials={c.user.name.split(" ").map((w) => w[0]).join("").slice(0, 2)} size={32} color="var(--accent)" />
                    <div style={{ background: "var(--surface-2)", borderRadius: "var(--r-sm)", padding: "10px 13px", flex: 1, border: "1px solid var(--line)" }}>
                      <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}><strong style={{ color: "var(--ink-2)" }}>{c.user.name}</strong> · {fmtDate(c.createdAt)}</div>
                      <div style={{ fontSize: 14, marginTop: 3 }}>{c.text}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <input className="input" placeholder="Dodaj komentarz wewnętrzny…" value={comment} onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && comment.trim()) addComment(); }} />
                <button className="btn btn-soft" disabled={!comment.trim() || loading} onClick={addComment}>
                  <Icon name="send" size={15} />Dodaj
                </button>
              </div>
            </SectionCard>
          )}
        </div>

        {/* Right rail */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 78 }}>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 14 }}>Akcje</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {isStaff && isPending && <>
                <button className="btn btn-ok" onClick={() => setModal("accept")} disabled={loading}><Icon name="check" size={16} />Akceptuj projekt</button>
                <button className="btn btn-ghost" onClick={() => setModal("info")} disabled={loading}><Icon name="info" size={16} />Poproś o uzupełnienie</button>
                <button className="btn btn-danger" onClick={() => setModal("reject")} disabled={loading}><Icon name="x" size={16} />Odrzuć</button>
              </>}
              {isStaff && isActive && <>
                <button className="btn btn-ok" onClick={() => action("close", { kind: "won" })} disabled={loading}><Icon name="checkCircle" size={16} />Zamknij sukcesem</button>
                <button className="btn btn-danger" onClick={() => action("close", { kind: "lost" })} disabled={loading}><Icon name="xCircle" size={16} />Zamknij – utracony</button>
              </>}
              {!isStaff && <>
                {project.status === "NEEDINFO" && <button className="btn btn-primary" onClick={() => router.push(`/partner/projects/${project.id}/edit`)}><Icon name="send" size={16} />Uzupełnij i wyślij</button>}
                {project.status === "EXPIRED" && <button className="btn btn-primary" onClick={() => action("extend", {})} disabled={loading}><Icon name="refresh" size={16} />Zgłoś kontynuację</button>}
                {isActive && expiringSoon && <button className="btn btn-primary" onClick={() => action("extend", {})} disabled={loading}><Icon name="refresh" size={16} />Przedłuż projekt</button>}
                {isActive && <button className="btn btn-brand" onClick={() => router.push(`/partner/projects/${project.id}/order/new`)}><Icon name="shoppingCart" size={16} />Złóż zamówienie</button>}
                {(isActive || project.status === "VERIFY" || project.status === "NEEDINFO") && (
                  <button className="btn btn-soft" onClick={() => router.push(`/partner/projects/${project.id}/edit`)}><Icon name="edit" size={16} />Edytuj dane</button>
                )}
                {isActive && <button className="btn btn-ghost" onClick={() => action("deactivate", {})} disabled={loading}><Icon name="shieldOff" size={16} />Dezaktywuj projekt</button>}
                {["WON", "LOST", "REJECT", "DEACT"].includes(project.status) && (
                  <div style={{ fontSize: 13, color: "var(--ink-3)" }}>Projekt zamknięty – brak dostępnych akcji.</div>
                )}
              </>}
            </div>
          </div>

          <div className="card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
            <KV label="Partner">{project.partner.name}</KV>
            <KV label="Handlowiec ASD">{project.rep.name}</KV>
            <KV label="Data zgłoszenia">{fmtDate(project.createdAt)}</KV>
            {project.acceptedAt && <KV label="Data akceptacji">{fmtDate(project.acceptedAt)}</KV>}
            {project.expiresAt && <KV label="Wygaśnięcie ochrony">{fmtDate(project.expiresAt)}</KV>}
            {project.discount != null && <KV label="Rabat projektu">{project.discount}%</KV>}
          </div>
        </div>
      </div>

      {/* Accept modal */}
      <AcceptModal open={modal === "accept"} project={project} onClose={() => setModal(null)} onAccept={(data) => action("accept", data)} />
      <RejectModal open={modal === "reject"} onClose={() => setModal(null)} onReject={(reason) => action("reject", { reason })} />
      <InfoModal open={modal === "info"} onClose={() => setModal(null)} onSend={(msg) => action("request-info", { message: msg })} />
    </div>
  );
}

function AcceptModal({ open, project, onClose, onAccept }: {
  open: boolean; project: FullProject; onClose: () => void;
  onAccept: (data: { months: number; discount: number; tender: boolean }) => void;
}) {
  const [months, setMonths] = useState(3);
  const [discount, setDiscount] = useState(project.partner.discount);
  const isTender = project.procurement === "PRZETARG";

  return (
    <Modal open={open} onClose={onClose} width={480}>
      <div style={{ padding: 24 }}>
        <h3 style={{ fontSize: 19 }}>Akceptacja projektu</h3>
        <p style={{ color: "var(--ink-3)", fontSize: 14, marginTop: 6 }}>{project.customerName} · <span className="mono">{project.customerTaxId}</span></p>
        {isTender && (
          <div style={{ marginTop: 16, padding: 13, borderRadius: "var(--r-sm)", background: "var(--warn-soft)", color: "#845509", fontSize: 13.5, display: "flex", gap: 9 }}>
            <Icon name="shieldOff" size={18} style={{ flex: "none" }} />Projekt przetargowy – zostanie zapisany jako <strong>Aktywny bez ochrony</strong>.
          </div>
        )}
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Okres ochrony">
            <div className="chips">
              {[3, 6].map((m) => (
                <button key={m} className={`chip box ${months === m ? "sel" : ""}`} onClick={() => setMonths(m)}>{m} mies.</button>
              ))}
            </div>
          </Field>
          {!isTender && (
            <Field label="Poziom rabatowy projektu" hint="Domyślnie dziedziczony z profilu Partnera – można nadpisać.">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input className="input" type="number" style={{ width: 100 }} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
                <span style={{ color: "var(--ink-2)" }}>% rabatu</span>
              </div>
            </Field>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>Anuluj</button>
          <button className="btn btn-ok" onClick={() => onAccept({ months, discount, tender: isTender })}>
            <Icon name="check" size={16} />{isTender ? "Zapisz bez ochrony" : "Akceptuj i chroń"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function RejectModal({ open, onClose, onReject }: { open: boolean; onClose: () => void; onReject: (r: string) => void }) {
  const [reason, setReason] = useState("");
  return (
    <Modal open={open} onClose={onClose} width={460}>
      <div style={{ padding: 24 }}>
        <h3 style={{ fontSize: 19 }}>Odrzucenie projektu</h3>
        <Field label="Powód odrzucenia" req style={{ marginTop: 16 }}>
          <textarea className="textarea" placeholder="Np. brak potencjału, klient obsługiwany bezpośrednio…" value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>Anuluj</button>
          <button className="btn btn-danger" disabled={!reason.trim()} onClick={() => onReject(reason.trim())}>Odrzuć projekt</button>
        </div>
      </div>
    </Modal>
  );
}

function InfoModal({ open, onClose, onSend }: { open: boolean; onClose: () => void; onSend: (m: string) => void }) {
  const [msg, setMsg] = useState("");
  return (
    <Modal open={open} onClose={onClose} width={460}>
      <div style={{ padding: 24 }}>
        <h3 style={{ fontSize: 19 }}>Poproś o uzupełnienie</h3>
        <Field label="Czego brakuje?" req style={{ marginTop: 16 }}>
          <textarea className="textarea" placeholder="Np. proszę podać decydenta i termin decyzji…" value={msg} onChange={(e) => setMsg(e.target.value)} />
        </Field>
        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>Anuluj</button>
          <button className="btn btn-brand" disabled={!msg.trim()} onClick={() => onSend(msg.trim())}>Wyślij prośbę</button>
        </div>
      </div>
    </Modal>
  );
}
