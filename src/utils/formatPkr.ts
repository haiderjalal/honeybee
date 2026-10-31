const pkrFormatter = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 });

/** Formats a whole-rupee amount as "Rs 6,000". */
export function formatPkr(amount: number): string {
  return `Rs ${pkrFormatter.format(Math.round(amount))}`;
}
