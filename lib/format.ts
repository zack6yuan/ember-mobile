/**
 * Compact count for reaction / reply pills: keeps chips from growing without
 * bound on popular posts. Below 1,000 shows the exact number; above that it
 * abbreviates with one decimal under 10 units (1.2k) and whole units past it
 * (12k, 1.4M). Never widens past ~4 characters.
 */
export function compactCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return abbrev(n / 1000, 'k');
  return abbrev(n / 1_000_000, 'M');
}

const abbrev = (value: number, suffix: string): string =>
  (value < 10 ? value.toFixed(1).replace(/\.0$/, '') : String(Math.round(value))) + suffix;
