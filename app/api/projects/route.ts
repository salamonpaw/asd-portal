import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProjectStatus, Procurement } from "@prisma/client";
import { NextResponse } from "next/server";

function nextId(max: number) {
  return `ASD-PRJ-2026-${String(max + 1).padStart(4, "0")}`;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "PARTNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const partnerId = (session.user as any).partnerId as string;
  const body = await req.json();

  const partner = await db.partner.findUnique({ where: { id: partnerId }, include: { rep: true } });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  // check for duplicates (other partner's active project with same taxId)
  const conflict = await db.project.findFirst({
    where: {
      customerTaxId: body.taxId,
      partnerId: { not: partnerId },
      status: { in: [ProjectStatus.ACTIVE, ProjectStatus.NOPROT] },
    },
  });

  // generate next ID
  const last = await db.project.findMany({ select: { id: true }, orderBy: { createdAt: "desc" }, take: 100 });
  const maxNum = last.reduce((m, p) => {
    const n = parseInt(p.id.split("-").pop() ?? "0", 10);
    return Math.max(m, n);
  }, 0);
  const id = nextId(maxNum);

  const isDup = !!conflict;
  const status = isDup ? ProjectStatus.DUP : ProjectStatus.VERIFY;

  const project = await db.project.create({
    data: {
      id,
      partnerId,
      repId: partner.repId,
      customerName: body.name.trim(),
      customerTaxId: body.taxId,
      customerCountry: body.country,
      location: body.location?.trim() || null,
      branch: body.branch?.trim() || null,
      machines: body.machines,
      procurement: body.procurement as Procurement,
      stage: body.stage,
      description: body.description.trim(),
      decisionDate: body.decisionDate || null,
      interested: body.interested,
      wantsSupport: body.wantsSupport,
      support: body.support ?? [],
      notes: body.notes?.trim() || null,
      status,
      protected: false,
      conflictsWith: conflict?.id ?? null,
      history: {
        create: [
          { who: `Partner · ${partner.short}`, text: "Zgłoszenie projektu" },
          isDup
            ? { who: "System", text: "Wykryto aktywny projekt z tym samym NIP – oznaczono jako duplikat" }
            : { who: "System", text: `Przekazano do weryfikacji – Handlowiec ${partner.rep?.name ?? ""}` },
        ],
      },
    },
  });

  return NextResponse.json(project, { status: 201 });
}
