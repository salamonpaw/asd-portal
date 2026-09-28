import type { MailSettings } from "@prisma/client";
import type { MailSettingsView } from "@/components/portal/MailSettingsForm";

/** Bezpieczny widok ustawień dla przeglądarki — bez hasła. */
export function toMailSettingsView(s: MailSettings | null): MailSettingsView {
  if (!s) return null;
  return {
    enabled: s.enabled, host: s.host, port: s.port, secure: s.secure, username: s.username ?? "",
    hasPassword: !!s.passwordEnc, fromName: s.fromName ?? "", fromEmail: s.fromEmail, replyTo: s.replyTo ?? "",
  };
}
