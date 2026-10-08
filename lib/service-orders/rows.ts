// Wiersze listy zamówień (magazyn / partner) — jedno zapytanie i jeden sposób liczenia kwot.
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { orderView } from "@/lib/pricing";
import { itemNumbers } from "@/lib/service-orders/server";
import type { ServiceOrderRow } from "@/components/portal/ServiceOrdersTable";

export async function serviceOrderRows(where: Prisma.ServiceOrderWhereInput): Promise<ServiceOrderRow[]> {
  const orders = await db.serviceOrder.findMany({
    where,
    include: {
      items: { select: { quantity: true, unitPrice: true, costPrice: true, discountType: true, discountValue: true, finalPrice: true } },
      technician: { select: { name: true } },
      partner: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return orders.map((o) => {
    const v = orderView(o.items.map(itemNumbers));
    return {
      id: o.id, code: o.code, status: o.status, partner: o.partner.name, technician: o.technician.name,
      items: o.items.length, quantity: o.items.reduce((s, i) => s + i.quantity, 0),
      total: v.priced ? v.total : null, currency: o.currency,
      neededDate: o.neededDate?.toISOString() ?? null, expectedDate: o.expectedDate?.toISOString() ?? null,
      createdAt: o.createdAt.toISOString(),
    };
  });
}
