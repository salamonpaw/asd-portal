import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { ProjectDetailClient } from "@/components/portal/ProjectDetailClient";

export default async function PartnerProjectDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const partnerId = (session.user as any).partnerId as string;

  const project = await db.project.findUnique({
    where: { id: params.id },
    include: {
      partner: { include: { markets: true } },
      rep: true,
      history: { orderBy: { date: "asc" } },
      comments: { include: { user: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!project) notFound();
  if (project.partnerId !== partnerId) redirect("/partner/projects");

  const conflict = project.conflictsWith
    ? await db.project.findUnique({ where: { id: project.conflictsWith }, include: { partner: true } })
    : null;

  return <ProjectDetailClient project={project} conflict={conflict} isStaff={false} backHref="/partner/projects" />;
}
