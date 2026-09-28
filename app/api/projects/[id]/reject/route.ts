import { NextResponse } from "next/server";
import { rejectProject } from "@/lib/actions/projects";
import { apiUser, STAFF_ROLES } from "@/lib/authz";
import { loadProjectFor } from "@/lib/project-access";

const PENDING = ["NEW", "VERIFY", "DUP", "NEEDINFO"];

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser(...STAFF_ROLES);
  if (user instanceof NextResponse) return user;
  const { id } = await params;
  const project = await loadProjectFor(user, id, { staffOnly: true });
  if (project instanceof NextResponse) return project;
  if (!PENDING.includes(project.status)) return NextResponse.json({ error: "Projekt nie czeka na decyzję." }, { status: 409 });

  const { reason } = await req.json().catch(() => ({}));
  const clean = typeof reason === "string" ? reason.trim().slice(0, 2000) : "";
  if (!clean) return NextResponse.json({ error: "Podaj powód odrzucenia." }, { status: 400 });
  return NextResponse.json(await rejectProject(id, user.name, clean));
}
