import { NextResponse } from "next/server";
import { addCommentToProject } from "@/lib/actions/projects";
import { apiUser, STAFF_ROLES } from "@/lib/authz";
import { loadProjectFor } from "@/lib/project-access";

// Komentarze wewnętrzne ASD — tylko pracownicy ASD
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser(...STAFF_ROLES);
  if (user instanceof NextResponse) return user;

  const { id } = await params;
  const project = await loadProjectFor(user, id, { staffOnly: true });
  if (project instanceof NextResponse) return project;

  const { text } = await req.json().catch(() => ({}));
  const clean = typeof text === "string" ? text.trim().slice(0, 5000) : "";
  if (!clean) return NextResponse.json({ error: "Pusty komentarz." }, { status: 400 });

  return NextResponse.json(await addCommentToProject(id, user.id, clean));
}
