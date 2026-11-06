/**
 * Money is handled as integer minor units (paisa): 100 minor units make PKR 1.
 * Floats are never used for stored or compared amounts, so totals and discounts stay exact.
 */

export const MINOR_UNITS_PER_RUPEE = 100;

/** Converts a whole-rupee catalogue price into minor units. */
export function rupeesToMinor(rupees: number): number {
  return Math.round(rupees * MINOR_UNITS_PER_RUPEE);
}

/**
 * Takes `rateBps` basis points (1000 = 10%) of an integer amount, rounding half up to the nearest minor unit.
 * Amounts are non-negative in every caller, so half-up is the same as "round half away from zero".
 */
export function percentOfMinor(amountMinor: number, rateBps: number): number {
  return Math.floor((amountMinor * rateBps + 5_000) / 10_000);
}
