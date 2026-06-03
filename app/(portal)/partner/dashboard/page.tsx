import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { PartnerDashboardClient } from "./PartnerDashboardClient";

export default async function PartnerDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const partnerId = (session.user as any).partnerId as string;
  if (!partnerId) redirect("/login");

  const [partner, projects, rep] = await Promise.all([
    db.partner.findUnique({ where: { id: partnerId }, include: { markets: true } }),
    db.project.findMany({
      where: { partnerId },
      include: { history: { orderBy: { date: "asc" } } },
      orderBy: { createdAt: "desc" },
    }),
    db.rep.findFirst({ where: { partners: { some: { id: partnerId } } } }),
  ]);

  if (!partner) redirect("/login");

  return <PartnerDashboardClient partner={partner} projects={projects} rep={rep} />;
}
