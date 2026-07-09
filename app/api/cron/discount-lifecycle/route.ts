import { processDiscountLifecycle } from "@/lib/cron/discount-lifecycle";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const authToken = request.headers.get("authorization");
  const expectedToken = process.env.CRON_SECRET_TOKEN;

  if (!expectedToken || authToken !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processDiscountLifecycle();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[Cron Error] discount-lifecycle", error);
    return NextResponse.json(
      { error: "Failed to process discount lifecycle", details: (error as Error).message },
      { status: 500 }
    );
  }
}
