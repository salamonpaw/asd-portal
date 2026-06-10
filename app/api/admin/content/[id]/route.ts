import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { invalidateContentCache } from "@/lib/cache";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { value } = await req.json();

  const item = await db.contentItem.update({
    where: { id },
    data: { value: value?.trim() ?? "" },
  });

  // Invalidate cache on content update
  await invalidateContentCache(item.group);

  return NextResponse.json(item);
}
