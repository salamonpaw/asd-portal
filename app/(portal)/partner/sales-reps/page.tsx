import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { PORTAL_URL } from "@/lib/config";
import { SalesRepsClient } from "./SalesRepsClient";

export default async function PartnerSalesRepsPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as string | undefined;
  const partnerId = session?.user?.partnerId;
  if (!session || (role !== "PARTNER" && role !== "PARTNER_ADMIN") || !partnerId) redirect("/login");

  const reps = await db.partnerSalesRep.findMany({
    where: { partnerId },
    orderBy: [{ active: "desc" }, { name: "asc" }],
    include: {
      _count: { select: { projects: true } },
      requests: { where: { status: "PENDING" }, select: { id: true } },
    },
  });

  return (
    <SalesRepsClient
      baseUrl={PORTAL_URL}
      reps={reps.map((r) => ({
        id: r.id, name: r.name, email: r.email, phone: r.phone, active: r.active,
        formToken: r.formToken, projects: r._count.projects, pending: r.requests.length,
      }))}
    />
  );
}
