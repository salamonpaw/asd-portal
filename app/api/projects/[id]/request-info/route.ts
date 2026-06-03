import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requestInfoProject } from "@/lib/actions/projects";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "STAFF") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const { message } = await req.json();
  const repId = (session.user as any).repId as string;
  const project = await requestInfoProject(id, session.user!.name!, repId, message);
  return NextResponse.json(project);
}
