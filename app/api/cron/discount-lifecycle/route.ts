import { processDiscountLifecycle } from "@/lib/cron/discount-lifecycle";
import { NextRequest, NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron-auth";

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processDiscountLifecycle();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[Cron Error] discount-lifecycle", error);
    return NextResponse.json(
      { error: "Failed to process discount lifecycle" },
      { status: 500 }
    );
  }
}
