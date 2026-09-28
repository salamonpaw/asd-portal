import { NextResponse } from "next/server";
import { createOrder } from "@/lib/actions/orders";
import { apiUser, PARTNER_ROLES } from "@/lib/authz";
import { loadProjectFor } from "@/lib/project-access";

export async function POST(req: Request) {
  const user = await apiUser(...PARTNER_ROLES);
  if (user instanceof NextResponse) return user;

  const { projectId } = await req.json().catch(() => ({}));
  if (typeof projectId !== "string" || !projectId) {
    return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
  }

  const project = await loadProjectFor(user, projectId, { partnerOnly: true });
  if (project instanceof NextResponse) return project;
  if (project.status !== "ACTIVE" && project.status !== "NOPROT") {
    return NextResponse.json({ error: "Zamówienie można złożyć tylko do aktywnego projektu." }, { status: 409 });
  }

  try {
    return NextResponse.json(await createOrder(projectId));
  } catch (err) {
    console.error("[api/orders]", err);
    return NextResponse.json({ error: "Nie udało się utworzyć zamówienia." }, { status: 500 });
  }
}
