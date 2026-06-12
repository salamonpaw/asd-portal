import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { RepProfileClient } from "./RepProfileClient";

export default async function RepProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const repId = session.user.repId;
  if (!repId) redirect("/staff/dashboard");

  const [rep, user] = await Promise.all([
    db.rep.findUnique({ where: { id: repId } }),
    db.user.findUnique({ where: { id: session.user.id }, select: { name: true, email: true } }),
  ]);

  if (!rep || !user) redirect("/staff/dashboard");

  return <RepProfileClient rep={rep} userEmail={user.email} userName={user.name} />;
}
