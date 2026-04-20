const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatCents(cents: number): string {
  return fmt.format(cents / 100);
}

export function dollarsToCents(dollars: string): number {
  const parsed = parseFloat(dollars);
  if (!isFinite(parsed) || parsed <= 0) return 0;
  return Math.round(parsed * 100);
}
