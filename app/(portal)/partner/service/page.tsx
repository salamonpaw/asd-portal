import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ServiceOrderClient } from "./ServiceOrderClient";

export default async function ServicePage() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;
  const partnerId = (session?.user as any)?.partnerId;

  if (!session || (userRole !== "SERVICE_TECHNICIAN" && userRole !== "PARTNER_ADMIN")) {
    redirect("/login");
  }

  // Get products + machine types for form
  const products = await db.product.findMany({
    include: { machineType: true },
    orderBy: { name: "asc" },
  });

  const machineTypes = await db.machineType.findMany({
    orderBy: { name: "asc" },
  });

  // Get user's service orders
  const orders = await db.serviceOrder.findMany({
    where: { partnerId },
    include: { items: { include: { product: true } }, warehouseSpecialist: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div style={{ padding: "32px" }}>
      <h1>Serwis — Zamówienia na części</h1>
      <p style={{ color: "var(--ink-3)", marginTop: 8 }}>Twórz i zarządzaj zamówieniami na części zamienne</p>

      <ServiceOrderClient
        products={products}
        machineTypes={machineTypes}
        initialOrders={orders}
        userEmail={session.user?.email || ""}
      />
    </div>
  );
}
