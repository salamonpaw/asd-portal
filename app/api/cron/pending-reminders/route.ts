import { checkPendingOrderReminders } from "@/lib/cron/pending-order-reminders";
import { NextRequest, NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron-auth";

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const result = await checkPendingOrderReminders();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[Cron Error]", error);
    return NextResponse.json(
      { error: "Failed to process reminders" },
      { status: 500 }
    );
  }
}
