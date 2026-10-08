import { notFound } from "next/navigation";
import { requirePageRole } from "@/lib/authz";
import { ServiceOrderView } from "@/components/portal/ServiceOrderView";

export const revalidate = 0;

export default async function PartnerServiceOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageRole("PARTNER", "PARTNER_ADMIN");
  if (!user.partnerId) notFound();
  const { id } = await params;
  const view = await ServiceOrderView({ orderId: id, partnerId: user.partnerId, basePath: "/partner/service", backHref: "/partner/service" });
  return view ?? notFound();
}
