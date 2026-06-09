import { db } from "@/lib/db";
import { getCachedContentItems, cacheContentItems } from "@/lib/cache";
import { LandingPageClient } from "./LandingPageClient";
import type { ContentItem } from "@prisma/client";

export const revalidate = 60; // ISR: revalidate every 60 seconds

export async function LandingPage() {
  let items: ContentItem[] = [];
  const group = "Landing page";

  try {
    // Try cache first
    const cached = await getCachedContentItems(group);
    if (cached) {
      items = cached;
    } else {
      // Cache miss: fetch from DB
      items = await db.contentItem.findMany({
        where: { group },
        orderBy: { key: "asc" },
      });
      // Populate cache for next request
      await cacheContentItems(items);
    }
  } catch (err) {
    console.warn("Failed to load landing content:", err instanceof Error ? err.message : String(err));
    // Fallback to empty
  }

  return <LandingPageClient items={items} />;
}
