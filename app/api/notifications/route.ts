import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // TODO: Fetch real notifications from DB based on user role
  // For now return empty array - UI is ready for integration
  const notifications: any[] = [];

  return NextResponse.json(notifications);
}
