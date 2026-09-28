import { NextResponse } from "next/server";
import { Procurement, ProjectStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { apiUser, STAFF_ROLES, PARTNER_ROLES } from "@/lib/authz";
import { loadProjectFor, stripInternal } from "@/lib/project-access";
import { RANGES, STAGES } from "@/lib/constants/project-form";

const PARTNER_EDITABLE: ProjectStatus[] = ["ACTIVE", "NOPROT", "VERIFY", "NEEDINFO"];
const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser(...STAFF_ROLES, ...PARTNER_ROLES);
  if (user instanceof NextResponse) return user;

  const { id } = await params;
  const project = await loadProjectFor(user, id);
  if (project instanceof NextResponse) return project;

  const isStaff = STAFF_ROLES.includes(user.role);
  const body = await req.json().catch(() => ({}));
  const resubmit = body.resubmit === true;

  if (!isStaff && !PARTNER_EDITABLE.includes(project.status)) {
    return NextResponse.json({ error: "Projektu w tym statusie nie można edytować." }, { status: 409 });
  }
  if (resubmit && project.status !== "NEEDINFO") {
    return NextResponse.json({ error: "Ponowne wysłanie możliwe tylko przy prośbie o uzupełnienie." }, { status: 409 });
  }
  if (!Object.values(Procurement).includes(body.procurement) || !RANGES.includes(body.machines) || !STAGES.includes(body.stage)) {
    return NextResponse.json({ error: "Nieprawidłowe dane formularza." }, { status: 400 });
  }
  const description = text(body.description, 5000);
  if (!description) return NextResponse.json({ error: "Opis jest wymagany." }, { status: 400 });

  const who = isStaff ? `Handlowiec · ${user.name}` : `Partner · ${project.partner.short}`;

  const updated = await db.project.update({
    where: { id },
    data: {
      location: text(body.location, 300) || null,
      branch: text(body.branch, 300) || null,
      machines: body.machines,
      procurement: body.procurement,
      stage: body.stage,
      description,
      notes: text(body.notes, 3000) || null,
      status: resubmit ? ProjectStatus.VERIFY : project.status,
      history: { create: { who, text: resubmit ? "Uzupełniono dane i wysłano ponownie" : "Zaktualizowano dane projektu" } },
    },
    include: {
      partner: { include: { markets: true } },
      rep: true,
      history: { orderBy: { date: "asc" } },
      comments: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
    },
  });

  return NextResponse.json(stripInternal(updated, user));
}
