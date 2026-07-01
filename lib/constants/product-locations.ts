// Product location categories for D810 machine
export const PRODUCT_LOCATIONS = [
  { value: "prawe-drzwi", label: "Prawe drzwi", icon: "📋" },
  { value: "lewe-drzwi", label: "Lewe drzwi", icon: "📋" },
  { value: "rama", label: "Rama", icon: "🔲" },
  { value: "obudowa", label: "Obudowa", icon: "📦" },
  { value: "silnik", label: "Silnik", icon: "⚙️" },
  { value: "elektronika", label: "Elektronika", icon: "🔌" },
  { value: "osprzęt", label: "Osprzęt", icon: "🔧" },
  { value: "inne", label: "Inne", icon: "📌" },
] as const;

export type ProductLocation = typeof PRODUCT_LOCATIONS[number]["value"];

export function getLocationLabel(location: string | null): string {
  if (!location) return "Nie przypisane";
  return PRODUCT_LOCATIONS.find((l) => l.value === location)?.label || location;
}

export function getLocationIcon(location: string | null): string {
  if (!location) return "❓";
  return PRODUCT_LOCATIONS.find((l) => l.value === location)?.icon || "📌";
}
