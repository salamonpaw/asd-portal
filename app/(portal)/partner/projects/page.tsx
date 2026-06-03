import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { PartnerProjectsClient } from "./PartnerProjectsClient";

export default async function PartnerProjectsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const partnerId = (session.user as any).partnerId as string;
  if (!partnerId) redirect("/login");

  const projects = await db.project.findMany({
    where: { partnerId },
    orderBy: { createdAt: "desc" },
  });

  return <PartnerProjectsClient projects={projects} />;
}
