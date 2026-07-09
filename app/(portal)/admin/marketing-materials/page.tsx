import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { MarketingMaterialsClient } from "./MarketingMaterialsClient";

export const metadata = { title: "Materiały marketingowe — Admin" };
export const revalidate = 0;

export default async function AdminMarketingMaterialsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const [materials, partners] = await Promise.all([
    db.marketingMaterial.findMany({
      orderBy: { createdAt: "desc" },
      include: { partnerAccess: { select: { partnerId: true } } },
    }),
    db.partner.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const initialMaterials = materials.map((m) => ({
    id: m.id,
    filename: m.filename,
    url: m.url,
    type: m.type,
    isActive: m.isActive,
    fileSize: m.fileSize,
    createdAt: m.createdAt.toISOString(),
    partnerIds: m.partnerAccess.map((a) => a.partnerId),
  }));

  return <MarketingMaterialsClient initialMaterials={initialMaterials} partners={partners} />;
}
