import { MEMBERSHIP } from "@/constants/membership";

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 86_400_000;

/**
 * Membership dates use the fixed offset that term expiry uses (Pakistan time, no daylight saving). The admin then
 * sees the same wall-clock times the rules calculate with, whatever time zone the server runs in.
 */
const OFFSET_MINUTES: number = MEMBERSHIP.termUtcOffsetMinutes;
const OFFSET_MS = OFFSET_MINUTES * MS_PER_MINUTE;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const LOCAL_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/;

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("en-PK", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});
const DATE_FORMAT = new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeZone: "UTC" });

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** The fixed offset written as "+05:00", for building instants from wall-clock text. */
function offsetSuffix(): string {
  const sign = OFFSET_MINUTES < 0 ? "-" : "+";
  const absolute = Math.abs(OFFSET_MINUTES);
  return `${sign}${pad(Math.floor(absolute / 60))}:${pad(absolute % 60)}`;
}

/** The membership wall clock for an instant, as "YYYY-MM-DDTHH:mm:ss". */
function wallClockOf(instant: Date): string {
  return new Date(instant.getTime() + OFFSET_MS).toISOString().slice(0, 19);
}

/** Converts "YYYY-MM-DDTHH:mm[:ss]" in membership time to an instant, or null when that time does not exist. */
function parseWallClock(value: string): Date | null {
  const withSeconds = value.length === 16 ? `${value}:00` : value;
  const instant = new Date(`${withSeconds}${offsetSuffix()}`);
  if (Number.isNaN(instant.getTime())) return null;

  // Some engines roll impossible dates such as 30 February forward. Comparing the round trip rejects them.
  return wallClockOf(instant) === withSeconds ? instant : null;
}

/** Start of a calendar day ("YYYY-MM-DD") in membership time, or null when the date is not real. */
export function parseMembershipDate(value: string): Date | null {
  return DATE_PATTERN.test(value) ? parseWallClock(`${value}T00:00:00`) : null;
}

/** Start of the day after a calendar day, so a whole day can be used as an exclusive upper bound. */
export function startOfNextMembershipDay(value: string): Date | null {
  const start = parseMembershipDate(value);
  return start ? new Date(start.getTime() + MS_PER_DAY) : null;
}

/** Parses a value from a datetime-local input, read as membership time. */
export function parseMembershipDateTime(value: string): Date | null {
  return LOCAL_DATE_TIME_PATTERN.test(value) ? parseWallClock(value) : null;
}

/** The calendar day ("YYYY-MM-DD") an instant falls on in membership time. */
export function toMembershipDateInput(instant: Date): string {
  return wallClockOf(instant).slice(0, 10);
}

/** Moves a calendar day by whole days. Returns null when the starting date is not valid. */
export function shiftMembershipDate(value: string, days: number): string | null {
  const start = parseMembershipDate(value);
  return start ? toMembershipDateInput(new Date(start.getTime() + days * MS_PER_DAY)) : null;
}

export function formatMembershipDateTime(instant: Date): string {
  return DATE_TIME_FORMAT.format(new Date(instant.getTime() + OFFSET_MS));
}

export function formatMembershipDate(instant: Date): string {
  return DATE_FORMAT.format(new Date(instant.getTime() + OFFSET_MS));
}

export function formatOptionalMembershipDateTime(instant: Date | null): string {
  return instant ? formatMembershipDateTime(instant) : "Not yet";
}
