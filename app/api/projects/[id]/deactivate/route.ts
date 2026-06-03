import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deactivateProject } from "@/lib/actions/projects";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const project = await db.project.findUnique({ where: { id }, include: { partner: true } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await deactivateProject(id, project.partner.short);
  return NextResponse.json(updated);
}
