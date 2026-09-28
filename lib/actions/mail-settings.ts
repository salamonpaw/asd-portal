"use server";

import { errMsg, AuthError } from "@/lib/authz";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import nodemailer from "nodemailer";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { encryptSecret, decryptSecret } from "@/lib/crypto";
import { base } from "@/lib/email";

type Scope = "global" | "partner";
type Res = { success: true; message?: string } | { success: false; error: string };

export type MailSettingsInput = {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;       // puste = zostaw obecne
  clearPassword?: boolean;
  fromName: string;
  fromEmail: string;
  replyTo: string;
};

/** Zwraca partnerId (dla scope=partner) albo null (global, tylko ADMIN). */
async function resolveScope(scope: Scope) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as string | undefined;
  if (scope === "global") {
    if (role !== "ADMIN") throw new AuthError("Tylko administrator może zmieniać serwer poczty ASD.");
    return { partnerId: null as string | null, email: session!.user.email };
  }
  const partnerId = session?.user?.partnerId;
  if ((role !== "PARTNER" && role !== "PARTNER_ADMIN") || !partnerId) throw new AuthError();
  return { partnerId, email: session!.user.email };
}

async function findSettings(partnerId: string | null) {
  return partnerId
    ? db.mailSettings.findUnique({ where: { partnerId } })
    : db.mailSettings.findFirst({ where: { partnerId: null } });
}

export async function saveMailSettings(scope: Scope, input: MailSettingsInput): Promise<Res> {
  try {
    const { partnerId } = await resolveScope(scope);
    const host = input.host.trim();
    const fromEmail = input.fromEmail.trim();
    const port = Math.round(Number(input.port));
    if (!host) return { success: false, error: "Podaj adres serwera SMTP." };
    if (!(port > 0 && port < 65536)) return { success: false, error: "Nieprawidłowy port." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail)) return { success: false, error: "Nieprawidłowy adres nadawcy." };

    const existing = await findSettings(partnerId);
    const passwordEnc = input.clearPassword
      ? null
      : input.password
      ? encryptSecret(input.password)
      : existing?.passwordEnc ?? null;

    const data = {
      enabled: input.enabled, host, port, secure: input.secure,
      username: input.username.trim() || null, passwordEnc,
      fromName: input.fromName.trim() || null, fromEmail, replyTo: input.replyTo.trim() || null,
    };

    if (existing) await db.mailSettings.update({ where: { id: existing.id }, data });
    else await db.mailSettings.create({ data: { ...data, partnerId } });

    revalidatePath(scope === "global" ? "/admin/mail-settings" : "/partner/settings");
    return { success: true, message: "Zapisano ustawienia poczty." };
  } catch (e) {
    return { success: false, error: errMsg(e) };
  }
}

export async function deleteMailSettings(scope: Scope): Promise<Res> {
  try {
    const { partnerId } = await resolveScope(scope);
    const existing = await findSettings(partnerId);
    if (existing) await db.mailSettings.delete({ where: { id: existing.id } });
    revalidatePath(scope === "global" ? "/admin/mail-settings" : "/partner/settings");
    return { success: true, message: "Usunięto — wysyłka wraca do serwera domyślnego." };
  } catch (e) {
    return { success: false, error: errMsg(e) };
  }
}

/** Wysyła testowego maila na adres zalogowanego użytkownika, używając ZAPISANYCH ustawień. */
export async function testMailSettings(scope: Scope): Promise<Res> {
  try {
    const { partnerId, email } = await resolveScope(scope);
    const s = await findSettings(partnerId);
    if (!s) return { success: false, error: "Najpierw zapisz ustawienia." };
    if (!email) return { success: false, error: "Twoje konto nie ma adresu e-mail." };

    const transporter = nodemailer.createTransport({
      host: s.host, port: s.port, secure: s.secure,
      auth: s.username ? { user: s.username, pass: s.passwordEnc ? decryptSecret(s.passwordEnc) : "" } : undefined,
      connectionTimeout: 15000,
    });
    await transporter.verify();
    await transporter.sendMail({
      from: s.fromName ? `${s.fromName} <${s.fromEmail}>` : s.fromEmail,
      to: email,
      replyTo: s.replyTo ?? undefined,
      subject: "✅ Test poczty — ASD Partner Portal",
      html: base(`<h1>Serwer poczty działa</h1><p>Ta wiadomość potwierdza, że konfiguracja SMTP (<b>${s.host}:${s.port}</b>) jest poprawna.</p>`),
    });
    return { success: true, message: `Wysłano wiadomość testową na ${email}.` };
  } catch (e) {
    return { success: false, error: `Test nieudany: ${(e as Error).message}` };
  }
}
