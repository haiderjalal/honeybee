/**
 * Normalises a Pakistani mobile number to the 03XXXXXXXXX form, or returns null when it is not one.
 * Accepts +92 and 0092 prefixes, with spaces, dashes, brackets or dots.
 */
export function normalizePakistaniMobile(input: string): string | null {
  const digits = input.replace(/[\s()\-.]/g, "");
  if (/^\+92\d{10}$/.test(digits)) return `0${digits.slice(3)}`;
  if (/^0092\d{10}$/.test(digits)) return `0${digits.slice(4)}`;
  if (/^03\d{9}$/.test(digits)) return digits;
  return null;
}
