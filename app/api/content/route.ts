import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const group = searchParams.get("group");

  try {
    const items = await db.contentItem.findMany({
      where: group ? { group } : undefined,
      orderBy: [{ group: "asc" }, { label: "asc" }],
    });

    return NextResponse.json(items);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch content items" },
      { status: 500 }
    );
  }
}
