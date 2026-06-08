import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Procurement, ProjectStatus } from "@prisma/client";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { resubmit, location, branch, machines, procurement, stage, description, notes } = body;

  const project = await db.project.findUnique({ where: { id }, include: { partner: true } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const historyText = resubmit
    ? "Uzupełniono dane i wysłano ponownie"
    : "Zaktualizowano dane projektu";

  const who = (session.user as any).role === "STAFF"
    ? `Handlowiec · ${session.user!.name}`
    : `Partner · ${project.partner.short}`;

  const updated = await db.project.update({
    where: { id },
    data: {
      location: location?.trim() || null,
      branch: branch?.trim() || null,
      machines,
      procurement: procurement as Procurement,
      stage,
      description: description?.trim(),
      notes: notes?.trim() || null,
      status: resubmit ? ProjectStatus.VERIFY : project.status,
      history: { create: { who, text: historyText } },
    },
    include: {
      partner: { include: { markets: true } },
      rep: true,
      history: { orderBy: { date: "asc" } },
      comments: { include: { user: true }, orderBy: { createdAt: "asc" } },
    },
  });

  return NextResponse.json(updated);
}
