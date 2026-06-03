import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { rejectProject } from "@/lib/actions/projects";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "STAFF") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const { reason } = await req.json();
  const project = await rejectProject(id, session.user!.name!, reason);
  return NextResponse.json(project);
}
