import { requirePageRole } from "@/lib/authz";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { PartnerProjectsClient } from "./PartnerProjectsClient";

export default async function PartnerProjectsPage() {
  const session = { user: await requirePageRole("PARTNER", "PARTNER_ADMIN") };

  const partnerId = session.user.partnerId;
  if (!partnerId) redirect("/login");

  const projects = await db.project.findMany({
    where: { partnerId },
    orderBy: { createdAt: "desc" },
  });

  return <PartnerProjectsClient projects={projects} />;
}
