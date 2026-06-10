import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { EditProjectForm } from "./EditProjectForm";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const partnerId = session.user.partnerId;
  if (!partnerId) redirect("/partner/projects");

  const { id } = await params;

  const project = await db.project.findUnique({ where: { id } });
  if (!project) notFound();
  if (project.partnerId !== partnerId) redirect("/partner/projects");

  // Only allow editing for editable statuses
  const editable = ["VERIFY", "NEEDINFO", "ACTIVE", "NOPROT"].includes(project.status);
  if (!editable) redirect(`/partner/projects/${id}`);

  return <EditProjectForm project={project} resubmit={project.status === "NEEDINFO"} />;
}
