import { z } from "zod";

import { ROUTES } from "@/constants/routes";

import { MIN_SEARCH_DIGITS, REPORT_WINDOW_DAYS } from "./adminConstants";
import { parseMembershipDate, shiftMembershipDate, startOfNextMembershipDay, toMembershipDateInput } from "./adminTime";

/** Parses the admin page's query string. Everything read here is untrusted input. */

export type SearchParamValue = string | string[] | undefined;

export type AdminSearchParams = Partial<Record<"q" | "term" | "order" | "from" | "to", SearchParamValue>>;

const uuidSchema = z.uuid();

/** The first value of a query parameter, trimmed. Empty when the parameter is absent. */
export function readParam(value: SearchParamValue): string {
  const first = Array.isArray(value) ? value[0] : value;
  return first?.trim() ?? "";
}

export type MemberQuery = { kind: "none" } | { kind: "invalid"; message: string } | { kind: "search"; query: string };

const MEMBER_QUERY_HINT = `Enter at least ${MIN_SEARCH_DIGITS} digits of the phone number, or a full account ID.`;

/**
 * Turns the search box into a lookup the repository can run. Phone searches match digits only, so a query with too
 * few digits is refused rather than matching every member.
 */
export function parseMemberQuery(raw: string): MemberQuery {
  if (raw === "") return { kind: "none" };
  if (uuidSchema.safeParse(raw).success) return { kind: "search", query: raw.toLowerCase() };

  // "+92" and "0092" prefixes become the local "0" form that is stored.
  const local = raw.replace(/^(\+92|0092)/, "0");
  if (local.replace(/\D/g, "").length < MIN_SEARCH_DIGITS) {
    return { kind: "invalid", message: MEMBER_QUERY_HINT };
  }
  return { kind: "search", query: local };
}

/** A membership ID, or null when the value is not one. */
export function parseTermId(raw: string): string | null {
  return uuidSchema.safeParse(raw).success ? raw : null;
}

/** A link to this admin page with only the given parameters, and an optional section to jump to. */
export function adminMembershipHref(params: Record<string, string>, hash?: string): string {
  const query = new URLSearchParams(params).toString();
  return `${ROUTES.adminMembership}?${query}${hash ? `#${hash}` : ""}`;
}

export type ReportRange = { ok: true; from: Date; to: Date } | { ok: false; message: string };

export interface ReportPeriod {
  fromValue: string;
  toValue: string;
  range: ReportRange;
}

const DATES_INVALID_MESSAGE = "Enter valid start and end dates.";
const DATES_ORDER_MESSAGE = "The start date must be on or before the end date.";

/**
 * The reporting window in membership time. Both dates are inclusive. Defaults to the last REPORT_WINDOW_DAYS days,
 * ending today. `range.to` is the start of the day after the end date, so the whole last day is included.
 */
export function parseReportPeriod(fromParam: string, toParam: string, now: Date): ReportPeriod {
  const toValue = toParam || toMembershipDateInput(now);
  const fromValue = fromParam || (shiftMembershipDate(toValue, -(REPORT_WINDOW_DAYS - 1)) ?? toValue);

  const from = parseMembershipDate(fromValue);
  const toExclusive = startOfNextMembershipDay(toValue);
  if (!from || !toExclusive) {
    return { fromValue, toValue, range: { ok: false, message: DATES_INVALID_MESSAGE } };
  }
  if (fromValue > toValue) {
    return { fromValue, toValue, range: { ok: false, message: DATES_ORDER_MESSAGE } };
  }
  return { fromValue, toValue, range: { ok: true, from, to: toExclusive } };
}
