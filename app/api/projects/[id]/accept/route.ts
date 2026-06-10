import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { acceptProject } from "@/lib/actions/projects";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "STAFF") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const { months, discount, tender } = await req.json();
  const project = await acceptProject(id, session.user!.name!, months ?? 3, discount ?? 8, tender ?? false);
  return NextResponse.json(project);
}
