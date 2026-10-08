/**
 * Statusy zamówień części — JEDNO źródło etykiet, kolorów i dozwolonych przejść.
 * Bez importów serwerowych (używane też w przeglądarce).
 */
import type { ServiceOrderStatus } from "@prisma/client";

export const STATUS_META: Record<ServiceOrderStatus, { label: string; color: string; bg: string; hint: string }> = {
  NOWE:                   { label: "Nowe",                   color: "var(--ink-2)",  bg: "var(--surface-3)",   hint: "Czeka na przyjęcie przez magazyn" },
  PRZYJĘTE:               { label: "Przyjęte",               color: "var(--brand)",  bg: "var(--brand-soft)",  hint: "Magazyn przyjął zamówienie" },
  OCZEKUJE_NA_CZESCI:     { label: "Oczekuje na części",     color: "#845509",       bg: "var(--warn-soft)",   hint: "Brak części na stanie — wysyłka po dostawie" },
  CZĘŚCIOWO_ZREALIZOWANE: { label: "Częściowo zrealizowane", color: "#1d5f8a",       bg: "#e3f0f8",            hint: "Wysłano dostępne części, reszta w osobnym zamówieniu" },
  ZREALIZOWANE:           { label: "Zrealizowane",           color: "#14633f",       bg: "var(--ok-soft)",     hint: "Wysłane" },
  ZAWIESZONE:             { label: "Zawieszone",             color: "var(--ink-3)",  bg: "var(--surface-3)",   hint: "Wstrzymane przez magazyn" },
  ODRZUCONE:              { label: "Odrzucone",              color: "#97271b",       bg: "var(--danger-soft)", hint: "Odrzucone przez magazyn" },
};

export const ORDER_STATUSES = Object.keys(STATUS_META) as ServiceOrderStatus[];

/** Po tych statusach zamówienie jest zamknięte: ceny i stany magazynowe już się nie zmieniają. */
export const CLOSED: ServiceOrderStatus[] = ["ZREALIZOWANE", "CZĘŚCIOWO_ZREALIZOWANE", "ODRZUCONE"];

export type OrderAction = "approve" | "suspend" | "resume" | "reject" | "fulfill" | "price";

const ALLOWED: Record<OrderAction, ServiceOrderStatus[]> = {
  approve: ["NOWE"],
  suspend: ["NOWE", "PRZYJĘTE", "OCZEKUJE_NA_CZESCI"],
  resume:  ["ZAWIESZONE"],
  reject:  ["NOWE", "PRZYJĘTE", "ZAWIESZONE", "OCZEKUJE_NA_CZESCI"],
  fulfill: ["NOWE", "PRZYJĘTE", "OCZEKUJE_NA_CZESCI"],
  price:   ["NOWE", "PRZYJĘTE", "ZAWIESZONE", "OCZEKUJE_NA_CZESCI"],
};

export const canDo = (status: ServiceOrderStatus, action: OrderAction) => ALLOWED[action].includes(status);
