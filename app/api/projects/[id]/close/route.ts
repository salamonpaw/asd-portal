import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { closeProject } from "@/lib/actions/projects";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "STAFF") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const { kind } = await req.json();
  const project = await closeProject(id, session.user!.name!, kind);
  return NextResponse.json(project);
}
