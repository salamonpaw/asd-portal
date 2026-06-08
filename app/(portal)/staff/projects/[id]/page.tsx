import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { ProjectDetailClient } from "@/components/portal/ProjectDetailClient";

export default async function StaffProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;

  const project = await db.project.findUnique({
    where: { id },
    include: {
      partner: { include: { markets: true } },
      rep: true,
      history: { orderBy: { date: "asc" } },
      comments: { include: { user: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!project) notFound();

  const conflict = project.conflictsWith
    ? await db.project.findUnique({ where: { id: project.conflictsWith }, include: { partner: true } })
    : null;

  return <ProjectDetailClient project={project} conflict={conflict} isStaff={true} backHref="/staff/projects" />;
}
