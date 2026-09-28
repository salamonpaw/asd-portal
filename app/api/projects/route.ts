import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createPartnerProject } from "@/lib/project-create";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PARTNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const partnerId = session.user.partnerId;
  if (!partnerId) {
    return NextResponse.json({ error: "No partnerId in session" }, { status: 401 });
  }

  const body = await req.json();

  try {
    const project = await createPartnerProject({ partnerId, input: body });
    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    if ((err as Error).message === "Partner not found") {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }
    throw err;
  }
}
