import { NextResponse } from "next/server";
import { createPartnerProject } from "@/lib/project-create";
import { apiUser, PARTNER_ROLES, UserError } from "@/lib/authz";

export async function POST(req: Request) {
  const user = await apiUser(...PARTNER_ROLES);
  if (user instanceof NextResponse) return user;
  if (!user.partnerId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  try {
    const project = await createPartnerProject({ partnerId: user.partnerId, input: body });
    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    if (err instanceof UserError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("[api/projects POST]", err);
    return NextResponse.json({ error: "Nie udało się zapisać zgłoszenia." }, { status: 500 });
  }
}
