import { requirePageRole } from "@/lib/authz";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ProjectDetailClient } from "@/components/portal/ProjectDetailClient";
import { getPartnerEffectiveDiscount } from "@/lib/discount";
import { ProjectSalesRepInfo } from "@/components/portal/ProjectSalesRepCard";

export default async function StaffProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageRole("STAFF", "ADMIN");

  const { id } = await params;

  const project = await db.project.findUnique({
    where: { id },
    include: {
      partner: { include: { markets: true } },
      rep: true,
      salesRep: { select: { id: true, name: true, email: true, phone: true, active: true } },
      history: { orderBy: { date: "asc" } },
      comments: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!project) notFound();

  const conflict = project.conflictsWith
    ? await db.project.findUnique({ where: { id: project.conflictsWith }, include: { partner: true } })
    : null;

  const partnerActiveDiscount = await getPartnerEffectiveDiscount(project.partnerId);

  return (
    <ProjectDetailClient
      project={project}
      conflict={conflict}
      isStaff={true}
      backHref="/staff/projects"
      partnerActiveDiscount={partnerActiveDiscount}
      extraSidebar={<ProjectSalesRepInfo rep={project.salesRep} />}
    />
  );
}
