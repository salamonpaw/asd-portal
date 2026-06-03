import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { addCommentToProject } from "@/lib/actions/projects";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { text } = await req.json();
  const userId = (session.user as any).id as string;

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const updated = await addCommentToProject(id, userId, text, user.name);
  return NextResponse.json(updated);
}
