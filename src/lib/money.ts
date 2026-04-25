const formatter = new Intl.NumberFormat("en-AE", {
  style: "currency",
  currency: "AED",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat("en-AE", {
  style: "currency",
  currency: "AED",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function fmtAED(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return "AED 0.00";
  return formatter.format(amount);
}

export function fmtAEDCompact(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return "AED 0";
  return compactFormatter.format(amount);
}

export function parseAED(input: string): number {
  const cleaned = input.replace(/[^\d.-]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}
