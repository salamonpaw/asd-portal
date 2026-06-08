import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { StaffProjectsClient } from "./StaffProjectsClient";

export default async function StaffProjectsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const repId = (session.user as any).repId as string;
  if (!repId) redirect("/login");

  const projects = await db.project.findMany({
    where: { repId },
    include: { partner: true, rep: true },
    orderBy: { createdAt: "desc" },
  });

  return <StaffProjectsClient projects={projects} />;
}
