import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { toMailSettingsView } from "@/lib/mail-settings-view";
import { PageHead, SectionCard } from "@/components/ui";
import { MailSettingsForm } from "@/components/portal/MailSettingsForm";

export default async function AdminMailSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role as string) !== "ADMIN") redirect("/login");

  const [global, partnerOverrides] = await Promise.all([
    db.mailSettings.findFirst({ where: { partnerId: null } }),
    db.mailSettings.findMany({ where: { partnerId: { not: null } }, include: { partner: { select: { name: true } } } }),
  ]);

  return (
    <div className="fadeup" style={{ maxWidth: 920 }}>
      <PageHead title="Serwer poczty (SMTP)" sub="Serwer poczty wychodzącej ASD — używany do wszystkich powiadomień portalu, chyba że partner ma własny." />
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <SectionCard title="Serwer ASD Systems">
          <MailSettingsForm
            scope="global"
            initial={toMailSettingsView(global)}
            fallbackLabel="używane są zmienne SMTP_* z pliku .env na serwerze."
          />
        </SectionCard>
        <SectionCard title="Partnerzy z własnym serwerem">
          {partnerOverrides.length === 0 ? (
            <div style={{ color: "var(--ink-3)", fontSize: 14 }}>Żaden partner nie skonfigurował własnego serwera.</div>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.8 }}>
              {partnerOverrides.map((m) => (
                <li key={m.id}><b>{m.partner?.name}</b> — {m.host}:{m.port} · {m.fromEmail} {m.enabled ? "" : "(wyłączony)"}</li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
