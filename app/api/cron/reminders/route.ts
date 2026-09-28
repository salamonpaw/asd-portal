import { processReminders } from "@/lib/cron/reminders";
import { NextRequest, NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron-auth";

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const dryRun = request.nextUrl.searchParams.get("dryRun") === "1";
    return NextResponse.json(await processReminders({ dryRun }));
  } catch (error) {
    console.error("[Cron Error] reminders", error);
    return NextResponse.json({ error: "Failed to process reminders" }, { status: 500 });
  }
}
