import { useState, useEffect } from "react";
import type { ContentItem } from "@prisma/client";

export function useContentItems(group?: string) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      try {
        const url = group ? `/api/content?group=${encodeURIComponent(group)}` : `/api/content`;
        const res = await fetch(url);

        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();
        setItems(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    fetch();
  }, [group]);

  return { items, loading, error };
}
