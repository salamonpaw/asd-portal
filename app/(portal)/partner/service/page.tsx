import { requirePageRole } from "@/lib/authz";
import { serviceOrderRows } from "@/lib/service-orders/rows";
import { PageHead } from "@/components/ui";
import { ServiceOrdersTable } from "@/components/portal/ServiceOrdersTable";
import { redirect } from "next/navigation";

export const revalidate = 0;

/** Zamówienia części całej firmy partnera (składają je serwisanci w swoim koszyku). */
export default async function PartnerServiceOrdersPage() {
  const user = await requirePageRole("PARTNER", "PARTNER_ADMIN");
  if (!user.partnerId) redirect("/login");
  return (
    <div className="fadeup">
      <PageHead title="Zamówienia części" sub="Zamówienia części złożone przez serwisantów Twojej firmy — statusy, wyceny i terminy dostaw." />
      <ServiceOrdersTable orders={await serviceOrderRows({ partnerId: user.partnerId })} basePath="/partner/service" showPartner={false} defaultTab="all" />
    </div>
  );
}
