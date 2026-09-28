import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { RequestsClient } from "./RequestsClient";

export default async function PartnerRequestsPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as string | undefined;
  const partnerId = session?.user?.partnerId;
  if (!session || (role !== "PARTNER" && role !== "PARTNER_ADMIN") || !partnerId) redirect("/login");

  const requests = await db.projectRequest.findMany({
    where: { partnerId },
    include: { salesRep: { select: { name: true, email: true, phone: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return <RequestsClient requests={requests} />;
}
