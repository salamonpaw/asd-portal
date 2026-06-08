import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { UserForm } from "../UserForm";

export default async function NewUserPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") redirect("/login");

  const [partners, reps] = await Promise.all([
    db.partner.findMany({ orderBy: { name: "asc" } }),
    db.rep.findMany({ orderBy: { name: "asc" } }),
  ]);

  return <UserForm partners={partners} reps={reps} />;
}
