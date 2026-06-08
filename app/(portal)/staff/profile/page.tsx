import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { RepProfileClient } from "./RepProfileClient";

export default async function RepProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const repId = (session.user as any).repId as string;
  if (!repId) redirect("/staff/dashboard");

  const rep = await db.rep.findUnique({ where: { id: repId } });
  if (!rep) redirect("/staff/dashboard");

  return <RepProfileClient rep={rep} />;
}
