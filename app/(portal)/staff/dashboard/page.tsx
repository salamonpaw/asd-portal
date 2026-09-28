import { requirePageRole, staffScope } from "@/lib/authz";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { StaffDashboardClient } from "./StaffDashboardClient";

export default async function StaffDashboardPage() {
  const user = await requirePageRole("STAFF", "ADMIN");
  const scope = staffScope(user);

  const [rep, projects, partners, orders] = await Promise.all([
    scope.repId ? db.rep.findUnique({ where: { id: scope.repId } }) : Promise.resolve(null),
    db.project.findMany({
      where: scope,
      include: { partner: true },
      orderBy: { createdAt: "desc" },
    }),
    db.partner.findMany({ where: scope }),
    db.order.findMany({
      where: { project: scope },
      include: { project: { include: { partner: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (scope.repId && !rep) redirect("/login");
  // Admin nie ma rekordu handlowca — widok wszystkich partnerów pod jego nazwą
  const viewer = rep ?? {
    id: "", name: user.name, initials: user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
    email: user.email, region: "Wszyscy partnerzy", phone: null, calendarUrl: null, photoUrl: null, bio: null,
  };

  return <StaffDashboardClient rep={viewer} projects={projects} partners={partners} orders={orders} />;
}
