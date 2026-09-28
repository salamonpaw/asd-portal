/** "30, 14,7,1" → [30,14,7,1] (unikalne, 0–365, malejąco, max 10). null gdy pusty/niepoprawny. */
export function parseDays(input: string | null | undefined): number[] | null {
  if (!input) return null;
  const nums = input
    .split(/[,;\s]+/)
    .map((x) => parseInt(x, 10))
    .filter((n) => Number.isFinite(n) && n >= 0 && n <= 365);
  const uniq = [...new Set(nums)].sort((a, b) => b - a).slice(0, 10);
  return uniq.length ? uniq : null;
}

export const DEFAULT_REMINDERS = {
  expiryEnabled: true,
  decisionEnabled: true,
  needInfoEnabled: true,
  pendingRequestEnabled: true,
  daysBefore: "30,14,7,1",
  repeatEveryDays: 3,
};
