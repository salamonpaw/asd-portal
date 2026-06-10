import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { StaffDashboardClient } from "./StaffDashboardClient";

export default async function StaffDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const repId = session.user.repId;
  if (!repId) redirect("/login");

  const [rep, projects, partners, orders] = await Promise.all([
    db.rep.findUnique({ where: { id: repId } }),
    db.project.findMany({
      where: { repId },
      include: { partner: true },
      orderBy: { createdAt: "desc" },
    }),
    db.partner.findMany({ where: { repId } }),
    db.order.findMany({
      where: { project: { repId } },
      include: { project: { include: { partner: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!rep) redirect("/login");

  return <StaffDashboardClient rep={rep} projects={projects} partners={partners} orders={orders} />;
}
