import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/authz";
import { getLocationLabel } from "@/lib/constants/product-locations";
import { OrderFormClient } from "./OrderFormClient";

export const revalidate = 0;

export default async function ServiceTechnicianProductsPage() {
  const user = await requirePageRole("SERVICE_TECHNICIAN");

  const [products, templates, last] = await Promise.all([
    db.product.findMany({
      select: {
        id: true, sku: true, name: true, description: true, location: true,
        machineType: { select: { label: true } },
        productImages: { where: { deletedAt: null }, select: { filePath: true }, orderBy: { uploadedAt: "asc" }, take: 6 },
      },
      orderBy: { name: "asc" },
    }),
    // Szablony firmy + ostatni adres dostawy (podpowiedź)
    db.orderTemplate.findMany({ where: { partnerId: user.partnerId ?? "__none__" }, include: { items: { select: { productId: true, quantity: true } } }, orderBy: { name: "asc" } }),
    db.serviceOrder.findFirst({ where: { technicianId: user.id }, orderBy: { createdAt: "desc" }, select: { deliveryAddress: true } }),
  ]);

  return (
    <OrderFormClient
      products={products.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        description: p.description ?? "",
        machineType: p.machineType.label,
        location: p.location ? getLocationLabel(p.location) : null,
        images: p.productImages.map((i) => i.filePath),
      }))}
      templates={templates.map((t) => ({ id: t.id, name: t.name, items: t.items }))}
      lastAddress={last?.deliveryAddress ?? ""}
    />
  );
}
