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
    console.error("Failed to load landing content:", err);
  }

  return <LandingPageClient items={items} />;
}
