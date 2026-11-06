const pkrFormatter = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 });
const pkrPreciseFormatter = new Intl.NumberFormat("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Formats a whole-rupee amount as "Rs 6,000". */
export function formatPkr(amount: number): string {
  return `Rs ${pkrFormatter.format(Math.round(amount))}`;
}

/** Formats an amount in minor units (paisa) as "Rs 349.90", or "Rs 350" when it is a whole number of rupees. */
export function formatPkrMinor(amountMinor: number): string {
  if (amountMinor % 100 === 0) return formatPkr(amountMinor / 100);
  return `Rs ${pkrPreciseFormatter.format(amountMinor / 100)}`;
}
