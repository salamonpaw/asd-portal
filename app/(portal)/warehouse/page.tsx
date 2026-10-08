import { requirePageRole } from "@/lib/authz";
import { serviceOrderRows } from "@/lib/service-orders/rows";
import { PageHead } from "@/components/ui";
import { ServiceOrdersTable } from "@/components/portal/ServiceOrdersTable";

export const revalidate = 0;

export default async function WarehousePage() {
  await requirePageRole("WAREHOUSE_SPECIALIST", "ADMIN");
  return (
    <div className="fadeup">
      <PageHead title="Zamówienia części" sub="Przyjmij, wyceń i zrealizuj zamówienia serwisantów. Kliknij zamówienie, aby je obsłużyć." />
      <ServiceOrdersTable orders={await serviceOrderRows({})} basePath="/warehouse/orders" />
    </div>
  );
}
