import { requirePageRole, staffScope } from "@/lib/authz";
import { db } from "@/lib/db";
import { StaffProjectsClient } from "./StaffProjectsClient";

export default async function StaffProjectsPage() {
  const user = await requirePageRole("STAFF", "ADMIN");
  const scope = staffScope(user);

  const projects = await db.project.findMany({
    where: scope,
    include: { partner: true, rep: true },
    orderBy: { createdAt: "desc" },
  });

  return <StaffProjectsClient projects={projects} />;
}
