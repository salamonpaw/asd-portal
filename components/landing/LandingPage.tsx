import { db } from "@/lib/db";
import { LandingPageClient } from "./LandingPageClient";
import type { ContentItem } from "@prisma/client";

export async function LandingPage() {
  let items: ContentItem[] = [];

  try {
    items = await db.contentItem.findMany({
      where: { group: "Landing page" },
      orderBy: { key: "asc" },
    });
  } catch (err) {
    console.warn("Failed to load landing content (may be offline during build):", err instanceof Error ? err.message : String(err));
    // Fallback to empty – client can still render without content
  }

  return <LandingPageClient items={items} />;
}
