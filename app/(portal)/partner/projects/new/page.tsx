import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { NewProjectForm } from "./NewProjectForm";

export default async function NewProjectPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const partnerId = (session.user as any).partnerId as string;
  if (!partnerId) redirect("/login");

  const partner = await db.partner.findUnique({
    where: { id: partnerId },
    include: { rep: true },
  });
  if (!partner) redirect("/login");

  // fetch existing active TaxIds for dup detection (partner's own)
  const activeTaxIds = await db.project.findMany({
    where: { partnerId, status: { in: ["ACTIVE", "NOPROT"] } },
    select: { customerTaxId: true, id: true },
  });

  return (
    <NewProjectForm
      partnerId={partnerId}
      partnerShort={partner.short}
      repName={partner.rep?.name ?? ""}
      repId={partner.repId}
      ownActiveTaxIds={activeTaxIds.map((p) => p.customerTaxId)}
    />
  );
}
