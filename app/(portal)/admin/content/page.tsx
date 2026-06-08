import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ContentManagerClient } from "./ContentManagerClient";

export default async function AdminContentPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") redirect("/login");

  const items = await db.contentItem.findMany({ orderBy: [{ group: "asc" }, { label: "asc" }] });

  return <ContentManagerClient items={items} />;
}
