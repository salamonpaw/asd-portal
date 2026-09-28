import { NextResponse } from "next/server";
import { closeProject } from "@/lib/actions/projects";
import { apiUser, STAFF_ROLES } from "@/lib/authz";
import { loadProjectFor } from "@/lib/project-access";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser(...STAFF_ROLES);
  if (user instanceof NextResponse) return user;
  const { id } = await params;
  const project = await loadProjectFor(user, id, { staffOnly: true });
  if (project instanceof NextResponse) return project;
  if (project.status !== "ACTIVE" && project.status !== "NOPROT") {
    return NextResponse.json({ error: "Zamknąć można tylko aktywny projekt." }, { status: 409 });
  }

  const { kind } = await req.json().catch(() => ({}));
  if (kind !== "won" && kind !== "lost") return NextResponse.json({ error: "Nieprawidłowy wynik." }, { status: 400 });
  return NextResponse.json(await closeProject(id, user.name, kind));
}
