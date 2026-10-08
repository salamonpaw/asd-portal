import { notFound } from "next/navigation";
import { requirePageRole } from "@/lib/authz";
import { ServiceOrderView } from "@/components/portal/ServiceOrderView";

export const revalidate = 0;

export default async function TechnicianOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageRole("SERVICE_TECHNICIAN");
  if (!user.partnerId) notFound();
  const { id } = await params;
  // tylko zamówienia własnej firmy (wcześniej: dowolne zamówienie po ID)
  const view = await ServiceOrderView({ orderId: id, partnerId: user.partnerId, basePath: "/service-technician/orders", backHref: "/service-technician/dashboard" });
  return view ?? notFound();
}
