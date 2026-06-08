import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createOrder } from "@/lib/actions/orders";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await req.json();

  if (!projectId) {
    return NextResponse.json(
      { error: "Project ID is required" },
      { status: 400 }
    );
  }

  try {
    const order = await createOrder(projectId);
    return NextResponse.json(order);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create order" },
      { status: 400 }
    );
  }
}
