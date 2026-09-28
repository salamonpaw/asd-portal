import nodemailer, { type Transporter } from "nodemailer";
import type { MailSettings } from "@prisma/client";
import { db } from "@/lib/db";
import { decryptSecret } from "@/lib/crypto";

type Resolved = { transporter: Transporter; from: string; replyTo?: string; source: "partner" | "global" | "env" };

function fromSettings(s: MailSettings, source: "partner" | "global"): Resolved {
  const transporter = nodemailer.createTransport({
    host: s.host,
    port: s.port,
    secure: s.secure,
    auth: s.username ? { user: s.username, pass: s.passwordEnc ? decryptSecret(s.passwordEnc) : "" } : undefined,
  });
  const from = s.fromName ? `${s.fromName} <${s.fromEmail}>` : s.fromEmail;
  return { transporter, from, replyTo: s.replyTo ?? undefined, source };
}

function fromEnv(): Resolved {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT ?? "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return { transporter, from: process.env.SMTP_FROM ?? "ASD Partner Portal <portal@asdsystems.eu>", source: "env" };
}

/** Kolejność: SMTP partnera (jeśli włączony) → globalny SMTP ASD z panelu admina → zmienne .env */
async function resolveTransport(partnerId?: string | null): Promise<Resolved> {
  if (partnerId) {
    const own = await db.mailSettings.findUnique({ where: { partnerId } });
    if (own?.enabled) return fromSettings(own, "partner");
  }
  const global = await db.mailSettings.findFirst({ where: { partnerId: null } });
  if (global?.enabled) return fromSettings(global, "global");
  return fromEnv();
}

export async function sendMail(opts: {
  partnerId?: string | null;
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}) {
  const t = await resolveTransport(opts.partnerId);
  await t.transporter.sendMail({
    from: t.from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    replyTo: opts.replyTo ?? t.replyTo,
  });
  return t.source;
}

/** Adresy e-mail osób po stronie partnera (konta partnera + e-mail firmowy). */
export async function partnerRecipients(partnerId: string): Promise<string[]> {
  const [partner, users] = await Promise.all([
    db.partner.findUnique({ where: { id: partnerId }, select: { email: true } }),
    db.user.findMany({ where: { partnerId, role: { in: ["PARTNER", "PARTNER_ADMIN"] } }, select: { email: true } }),
  ]);
  const list = users.map((u) => u.email);
  if (partner?.email) list.push(partner.email);
  return [...new Set(list.filter(Boolean))];
}
