import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { PartnerDashboardClient } from "./PartnerDashboardClient";

export default async function PartnerDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const partnerId = session.user.partnerId;
  if (!partnerId) redirect("/login");

  const [partner, projects, rep, orders, pendingRequests] = await Promise.all([
    db.partner.findUnique({
      where: { id: partnerId },
      include: {
        markets: true,
        discounts: {
          where: { status: "ACTIVE", expirationDate: { gte: new Date() } },
          orderBy: { expirationDate: "asc" },
          take: 1,
        },
      },
    }),
    db.project.findMany({
      where: { partnerId },
      include: { history: { orderBy: { date: "asc" } } },
      orderBy: { createdAt: "desc" },
    }),
    db.rep.findFirst({ where: { partners: { some: { id: partnerId } } } }),
    db.order.findMany({
      where: { project: { partnerId } },
      orderBy: { createdAt: "desc" },
    }),
    db.projectRequest.count({ where: { partnerId, status: "PENDING" } }),
  ]);

  if (!partner) redirect("/login");

  const openOrders = orders.filter((o) => !["delivered", "done"].includes(o.status)).length;

  // Aktywny tier rabatowy (jeśli istnieje) nadpisuje domyślny rabat partnera
  const activeTier = partner.discounts[0] ?? null;
  const activeDiscount = activeTier
    ? {
        percentage: parseFloat(activeTier.percentage.toString()),
        expirationDate: activeTier.expirationDate,
        source: "tier" as const,
      }
    : {
        percentage: partner.discount,
        expirationDate: null,
        source: "default" as const,
      };

  return (
    <PartnerDashboardClient
      partner={partner}
      projects={projects}
      rep={rep}
      openOrders={openOrders}
      activeDiscount={activeDiscount}
      pendingRequests={pendingRequests}
    />
  );
}
