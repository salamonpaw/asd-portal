import { NextResponse } from "next/server";
import { deactivateProject } from "@/lib/actions/projects";
import { apiUser, PARTNER_ROLES } from "@/lib/authz";
import { loadProjectFor, stripInternal } from "@/lib/project-access";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser(...PARTNER_ROLES);
  if (user instanceof NextResponse) return user;

  const { id } = await params;
  const project = await loadProjectFor(user, id, { partnerOnly: true });
  if (project instanceof NextResponse) return project;

  if (project.status !== "ACTIVE" && project.status !== "NOPROT") {
    return NextResponse.json({ error: "Dezaktywować można tylko aktywny projekt." }, { status: 409 });
  }

  const res = await deactivateProject(id, project.partner.short);
  return NextResponse.json(res.success ? { ...res, data: stripInternal(res.data, user) } : res);
}
