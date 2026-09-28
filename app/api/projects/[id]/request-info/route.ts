import { NextResponse } from "next/server";
import { requestInfoProject } from "@/lib/actions/projects";
import { apiUser, STAFF_ROLES } from "@/lib/authz";
import { loadProjectFor } from "@/lib/project-access";

const PENDING = ["NEW", "VERIFY", "DUP", "NEEDINFO"];

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser(...STAFF_ROLES);
  if (user instanceof NextResponse) return user;
  const { id } = await params;
  const project = await loadProjectFor(user, id, { staffOnly: true });
  if (project instanceof NextResponse) return project;
  if (!PENDING.includes(project.status)) return NextResponse.json({ error: "Projekt nie jest w weryfikacji." }, { status: 409 });

  const { message } = await req.json().catch(() => ({}));
  const clean = typeof message === "string" ? message.trim().slice(0, 3000) : "";
  if (!clean) return NextResponse.json({ error: "Podaj treść prośby." }, { status: 400 });
  return NextResponse.json(await requestInfoProject(id, user.name, user.id, clean));
}
