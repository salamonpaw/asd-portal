import { processReminders } from "@/lib/cron/reminders";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const authToken = request.headers.get("authorization");
  const expectedToken = process.env.CRON_SECRET_TOKEN;

  if (!expectedToken || authToken !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const dryRun = request.nextUrl.searchParams.get("dryRun") === "1";
    return NextResponse.json(await processReminders({ dryRun }));
  } catch (error) {
    console.error("[Cron Error] reminders", error);
    return NextResponse.json({ error: "Failed to process reminders", details: (error as Error).message }, { status: 500 });
  }
}
