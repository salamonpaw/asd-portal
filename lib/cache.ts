import { createClient } from "redis";
import type { ContentItem } from "@prisma/client";

let redisClient: ReturnType<typeof createClient> | null = null;

export async function getRedisClient() {
  if (!process.env.REDIS_URL) return null;

  if (redisClient) return redisClient;

  try {
    redisClient = createClient({ url: process.env.REDIS_URL });
    await redisClient.connect();
    return redisClient;
  } catch (err) {
    console.warn("Redis connection failed, caching disabled:", err instanceof Error ? err.message : String(err));
    return null;
  }
}

const CACHE_TTL = 60; // 60 seconds for ISR-style revalidation

export async function cacheContentItems(items: ContentItem[]): Promise<void> {
  const client = await getRedisClient();
  if (!client) return;

  try {
    await client.setEx("landing:content", CACHE_TTL, JSON.stringify(items));
  } catch (err) {
    console.warn("Cache write failed:", err instanceof Error ? err.message : String(err));
  }
}

export async function getCachedContentItems(group: string): Promise<ContentItem[] | null> {
  const client = await getRedisClient();
  if (!client) return null;

  try {
    const cached = await client.get(`landing:${group}`);
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    console.warn("Cache read failed:", err instanceof Error ? err.message : String(err));
    return null;
  }
}

export async function invalidateContentCache(group?: string): Promise<void> {
  const client = await getRedisClient();
  if (!client) return;

  try {
    if (group) {
      await client.del(`landing:${group}`);
    } else {
      // Invalidate all content caches
      const keys = await client.keys("landing:*");
      if (keys.length > 0) {
        await client.del(keys);
      }
    }
  } catch (err) {
    console.warn("Cache invalidation failed:", err instanceof Error ? err.message : String(err));
  }
}
