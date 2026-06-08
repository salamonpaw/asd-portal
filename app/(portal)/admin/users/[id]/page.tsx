import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { UserForm } from "../UserForm";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") redirect("/login");

  const { id } = await params;
  const [user, partners, reps] = await Promise.all([
    db.user.findUnique({ where: { id } }),
    db.partner.findMany({ orderBy: { name: "asc" } }),
    db.rep.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!user) notFound();

  return <UserForm user={user} partners={partners} reps={reps} />;
}
