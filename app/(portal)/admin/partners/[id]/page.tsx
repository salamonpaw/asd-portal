import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { PartnerForm } from "../PartnerForm";

export default async function EditPartnerPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const { id } = await params;
  const [partner, reps] = await Promise.all([
    db.partner.findUnique({ where: { id }, include: { markets: true } }),
    db.rep.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!partner) notFound();
  return <PartnerForm partner={partner} reps={reps} />;
}
