import { NextResponse } from "next/server";
import { acceptProject } from "@/lib/actions/projects";
import { apiUser, STAFF_ROLES } from "@/lib/authz";
import { loadProjectFor } from "@/lib/project-access";

const PENDING = ["NEW", "VERIFY", "DUP", "NEEDINFO"];

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser(...STAFF_ROLES);
  if (user instanceof NextResponse) return user;
  const { id } = await params;
  const project = await loadProjectFor(user, id, { staffOnly: true });
  if (project instanceof NextResponse) return project;
  if (!PENDING.includes(project.status)) return NextResponse.json({ error: "Projekt nie czeka na akceptację." }, { status: 409 });

  const { months, discount, tender } = await req.json().catch(() => ({}));
  const m = months === 6 ? 6 : 3;
  const d = Number.isFinite(discount) ? Math.max(0, Math.min(100, Math.round(discount))) : project.lockedDiscountPercentage ?? project.partner.discount;
  return NextResponse.json(await acceptProject(id, user.name, m, d, tender === true));
}
