import type { ServiceOrderStatus } from "@prisma/client";
import { STATUS_META } from "@/lib/service-orders/status";

/** Status zamówienia części — ten sam wygląd na każdym ekranie. */
export function OrderStatusBadge({ status, expectedDate }: { status: ServiceOrderStatus; expectedDate?: Date | string | null }) {
  const m = STATUS_META[status];
  return (
    <span title={m.hint} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, color: m.color, background: m.bg, whiteSpace: "nowrap" }}>
      {m.label}
      {status === "OCZEKUJE_NA_CZESCI" && expectedDate && (
        <span style={{ fontWeight: 500 }}>· do {new Date(expectedDate).toLocaleDateString("pl-PL")}</span>
      )}
    </span>
  );
}
