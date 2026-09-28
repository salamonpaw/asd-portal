import { requirePageRole } from "@/lib/authz";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { ProjectDetailClient } from "@/components/portal/ProjectDetailClient";
import { getPartnerEffectiveDiscount } from "@/lib/discount";
import { DEFAULT_REMINDERS } from "@/lib/reminder-days";
import { ProjectSalesRepCard } from "@/components/portal/ProjectSalesRepCard";

export default async function PartnerProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = { user: await requirePageRole("PARTNER", "PARTNER_ADMIN") };

  const partnerId = session.user.partnerId;
  if (!partnerId) redirect("/partner/projects");

  const { id } = await params;

  const project = await db.project.findUnique({
    where: { id },
    include: {
      partner: { include: { markets: true } },
      rep: true,
      history: { orderBy: { date: "asc" } },
      comments: { where: { internal: false }, include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!project) notFound();
  if (project.partnerId !== partnerId) redirect("/partner/projects");

  // Dane projektu innego partnera (konflikt NIP) nie trafiają do przeglądarki partnera
  const conflict = null;

  const [partnerActiveDiscount, reps, reminderSettings] = await Promise.all([
    getPartnerEffectiveDiscount(partnerId),
    db.partnerSalesRep.findMany({
      where: { partnerId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, phone: true, active: true },
    }),
    db.reminderSettings.findUnique({ where: { partnerId }, select: { daysBefore: true } }),
  ]);

  return (
    <ProjectDetailClient
      project={project}
      conflict={conflict}
      isStaff={false}
      backHref="/partner/projects"
      partnerActiveDiscount={partnerActiveDiscount}
      extraSidebar={
        <ProjectSalesRepCard
          projectId={project.id}
          reps={reps}
          initial={{ salesRepId: project.salesRepId, reminderDaysBefore: project.reminderDaysBefore, remindersMuted: project.remindersMuted }}
          defaultDays={reminderSettings?.daysBefore ?? DEFAULT_REMINDERS.daysBefore}
        />
      }
    />
  );
}
