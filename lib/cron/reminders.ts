import { differenceInCalendarDays } from "date-fns";
import type { ReminderSettings, ProjectStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { PORTAL_URL } from "@/lib/config";
import { sendMail, partnerRecipients } from "@/lib/mailer";
import { parseDays, DEFAULT_REMINDERS } from "@/lib/reminder-days";
import { tplDeadline, tplNeedInfo, tplPendingRequest } from "@/lib/email-partner";

type Kind = "EXPIRY" | "DECISION" | "NEEDINFO" | "PENDING_REQUEST";
type Settings = Pick<ReminderSettings, "expiryEnabled" | "decisionEnabled" | "needInfoEnabled" | "pendingRequestEnabled" | "daysBefore" | "repeatEveryDays">;
type Planned = { type: Kind; key: string; to: string[]; subject: string; html: string; partnerId: string; projectId?: string; requestId?: string };

const OPEN_FOR_EXPIRY: ProjectStatus[] = ["ACTIVE", "NOPROT"];
const OPEN_FOR_DECISION: ProjectStatus[] = ["NEW", "VERIFY", "ACTIVE", "NOPROT", "NEEDINFO", "DUP"];

/** Najciaśniejszy próg, w który wpadamy (np. zostało 6 dni, progi 30/14/7/1 → 7). */
function thresholdHit(daysLeft: number, thresholds: number[]) {
  const hits = thresholds.filter((t) => daysLeft >= 0 && daysLeft <= t);
  return hits.length ? Math.min(...hits) : null;
}

/** "2026-11" → 1 listopada 2026 */
function monthStart(ym: string | null) {
  const m = ym?.match(/^(\d{4})-(\d{2})$/);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, 1) : null;
}

export async function processReminders({ dryRun = false } = {}) {
  const now = new Date();
  const settingsCache = new Map<string, Settings>();
  const partnerMailCache = new Map<string, string[]>();

  const settingsFor = async (partnerId: string) => {
    if (!settingsCache.has(partnerId)) {
      const s = await db.reminderSettings.findUnique({ where: { partnerId } });
      settingsCache.set(partnerId, s ?? DEFAULT_REMINDERS);
    }
    return settingsCache.get(partnerId)!;
  };
  const partnerMails = async (partnerId: string) => {
    if (!partnerMailCache.has(partnerId)) partnerMailCache.set(partnerId, await partnerRecipients(partnerId));
    return partnerMailCache.get(partnerId)!;
  };
  const alreadySent = async (key: string) => !!(await db.reminderLog.findFirst({ where: { key }, select: { id: true } }));
  const sentWithin = async (type: Kind, where: { projectId?: string; requestId?: string; key?: string }, days: number) =>
    !!(await db.reminderLog.findFirst({
      where: { type, ...where, sentAt: { gte: new Date(now.getTime() - days * 86400000 + 3600000) } }, // -1h tolerancji na godzinę crona
      select: { id: true },
    }));

  const planned: Planned[] = [];

  // ── Projekty: wygaśnięcie ochrony, termin decyzji, prośba o uzupełnienie ──
  const projects = await db.project.findMany({
    where: { remindersMuted: false, status: { in: [...new Set([...OPEN_FOR_EXPIRY, ...OPEN_FOR_DECISION])] } },
    include: { salesRep: true },
  });

  for (const p of projects) {
    const s = await settingsFor(p.partnerId);
    const thresholds = parseDays(p.reminderDaysBefore) ?? parseDays(s.daysBefore) ?? [];
    const rep = p.salesRep?.active ? p.salesRep : null;
    const projectLink = `${PORTAL_URL}/partner/projects/${p.id}`;
    const deadlineTo = rep ? [rep.email] : await partnerMails(p.partnerId);
    if (!deadlineTo.length) continue;

    // 1) Wygaśnięcie ochrony
    if (s.expiryEnabled && p.expiresAt && OPEN_FOR_EXPIRY.includes(p.status)) {
      const left = differenceInCalendarDays(p.expiresAt, now);
      const t = thresholdHit(left, thresholds);
      const key = `EXPIRY:${p.id}:${p.expiresAt.toISOString().slice(0, 10)}:${t}`;
      if (t !== null && !(await alreadySent(key))) {
        const mail = tplDeadline({ kind: "EXPIRY", recipientName: rep?.name, projectId: p.id, customerName: p.customerName, date: p.expiresAt, daysLeft: left, link: rep ? undefined : projectLink });
        planned.push({ type: "EXPIRY", key, to: deadlineTo, ...mail, partnerId: p.partnerId, projectId: p.id });
      }
    }

    // 2) Planowany termin decyzji klienta
    const decision = monthStart(p.decisionDate);
    if (s.decisionEnabled && decision && OPEN_FOR_DECISION.includes(p.status)) {
      const left = differenceInCalendarDays(decision, now);
      const t = thresholdHit(left, thresholds);
      const key = `DECISION:${p.id}:${p.decisionDate}:${t}`;
      if (t !== null && !(await alreadySent(key))) {
        const mail = tplDeadline({ kind: "DECISION", recipientName: rep?.name, projectId: p.id, customerName: p.customerName, date: decision, daysLeft: left, link: rep ? undefined : projectLink });
        planned.push({ type: "DECISION", key, to: deadlineTo, ...mail, partnerId: p.partnerId, projectId: p.id });
      }
    }

    // 3) ASD prosi o uzupełnienie — partner (może edytować) + handlowiec, co N dni
    if (s.needInfoEnabled && p.status === "NEEDINFO") {
      const waitingDays = differenceInCalendarDays(now, p.updatedAt);
      if (waitingDays >= s.repeatEveryDays && !(await sentWithin("NEEDINFO", { projectId: p.id }, s.repeatEveryDays))) {
        const to = [...new Set([...(await partnerMails(p.partnerId)), ...(rep ? [rep.email] : [])])];
        const mail = tplNeedInfo({ projectId: p.id, customerName: p.customerName, link: projectLink });
        planned.push({ type: "NEEDINFO", key: `NEEDINFO:${p.id}:${now.toISOString().slice(0, 10)}`, to, ...mail, partnerId: p.partnerId, projectId: p.id });
      }
    }
  }

  // ── Zgłoszenia handlowców czekające na partnera (jeden zbiorczy mail / partner) ──
  const pending = await db.projectRequest.groupBy({
    by: ["partnerId"],
    where: { status: "PENDING" },
    _count: { _all: true },
    _min: { createdAt: true },
  });
  for (const g of pending) {
    const s = await settingsFor(g.partnerId);
    if (!s.pendingRequestEnabled || !g._min.createdAt) continue;
    const oldestDays = differenceInCalendarDays(now, g._min.createdAt);
    const key = `PENDING_REQUEST:${g.partnerId}`;
    if (oldestDays < s.repeatEveryDays || (await sentWithin("PENDING_REQUEST", { key }, s.repeatEveryDays))) continue;
    const to = await partnerMails(g.partnerId);
    if (!to.length) continue;
    const mail = tplPendingRequest({ count: g._count._all, oldestDays, link: `${PORTAL_URL}/partner/requests` });
    planned.push({ type: "PENDING_REQUEST", key, to, ...mail, partnerId: g.partnerId });
  }

  // ── Wysyłka ──
  const sent: Record<Kind, number> = { EXPIRY: 0, DECISION: 0, NEEDINFO: 0, PENDING_REQUEST: 0 };
  const errors: string[] = [];

  if (!dryRun) {
    for (const m of planned) {
      try {
        await sendMail({ partnerId: m.partnerId, to: m.to, subject: m.subject, html: m.html });
        await db.reminderLog.create({
          data: { type: m.type, key: m.key, projectId: m.projectId, requestId: m.requestId, recipient: m.to.join(", ") },
        });
        sent[m.type]++;
      } catch (e) {
        errors.push(`${m.key}: ${(e as Error).message}`);
      }
    }
  }

  return {
    success: true,
    dryRun,
    planned: planned.length,
    sent,
    errors,
    ...(dryRun ? { items: planned.map((m) => ({ type: m.type, key: m.key, to: m.to, subject: m.subject })) } : {}),
  };
}
