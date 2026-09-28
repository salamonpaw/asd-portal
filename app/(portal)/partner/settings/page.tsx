import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { DEFAULT_REMINDERS } from "@/lib/reminder-days";
import { toMailSettingsView } from "@/lib/mail-settings-view";
import { PageHead, SectionCard } from "@/components/ui";
import { MailSettingsForm } from "@/components/portal/MailSettingsForm";
import { ReminderSettingsForm } from "./ReminderSettingsForm";

export default async function PartnerSettingsPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as string | undefined;
  const partnerId = session?.user?.partnerId;
  if (!session || (role !== "PARTNER" && role !== "PARTNER_ADMIN") || !partnerId) redirect("/login");

  const [reminders, mail] = await Promise.all([
    db.reminderSettings.findUnique({ where: { partnerId } }),
    db.mailSettings.findUnique({ where: { partnerId } }),
  ]);

  const r = reminders ?? DEFAULT_REMINDERS;

  return (
    <div className="fadeup" style={{ maxWidth: 920 }}>
      <PageHead title="Ustawienia" sub="Rytm przypomnień e-mail dla Twoich handlowców i opcjonalnie własny serwer poczty." />
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <SectionCard title="Przypomnienia o terminach">
          <ReminderSettingsForm
            initial={{
              expiryEnabled: r.expiryEnabled, decisionEnabled: r.decisionEnabled,
              needInfoEnabled: r.needInfoEnabled, pendingRequestEnabled: r.pendingRequestEnabled,
              daysBefore: r.daysBefore, repeatEveryDays: r.repeatEveryDays,
            }}
          />
        </SectionCard>
        <SectionCard title="Własny serwer poczty (opcjonalnie)">
          <MailSettingsForm
            scope="partner"
            initial={toMailSettingsView(mail)}
            fallbackLabel="maile wychodzą z serwera ASD Systems. Skonfiguruj, jeśli chcesz wysyłać z adresu swojej firmy."
          />
        </SectionCard>
      </div>
    </div>
  );
}
