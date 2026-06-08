import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { PartnerForm } from "../PartnerForm";

export default async function NewPartnerPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") redirect("/login");

  const reps = await db.rep.findMany({ orderBy: { name: "asc" } });
  return <PartnerForm reps={reps} />;
}
