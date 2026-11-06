import "server-only";

import { describeMembershipError } from "@/features/membership/membershipErrorCopy";
import { logger } from "@/lib/logger";
import type {
  MembershipRepository,
  PendingPayment,
  ReportTotals,
  StoredRedemption,
  StoredRedemptionLine,
  StoredTerm,
  TermDetail,
} from "@/services/membership/membership.repository";
import { getMembershipReport } from "@/services/membership/membership.service";

import { MAX_ORDER_REFERENCE_LENGTH, MEMBER_SEARCH_LIMIT } from "./adminConstants";
import { parseTermId, type ReportRange } from "./adminQuery";

/** Reads for each admin section. A failed read carries its own message, so the rest of the page still renders. */
export type SectionResult<T> = { ok: true; data: T } | { ok: false; message: string };

export interface OrderDetail {
  redemption: StoredRedemption;
  lines: StoredRedemptionLine[];
}

async function readSection<T>(section: string, read: () => Promise<T>): Promise<SectionResult<T>> {
  try {
    return { ok: true, data: await read() };
  } catch (error) {
    logger.error("Membership admin read failed", { section, error });
    return { ok: false, message: describeMembershipError(error) };
  }
}

export async function loadPendingPayments(repo: MembershipRepository): Promise<SectionResult<PendingPayment[]>> {
  return readSection("pending_payments", () => repo.listPendingPayments());
}

export async function loadMemberSearch(
  repo: MembershipRepository,
  query: string,
): Promise<SectionResult<StoredTerm[]>> {
  return readSection("member_search", () => repo.searchTerms(query, MEMBER_SEARCH_LIMIT));
}

/** An id that is not a membership ID is treated as not found, without a database call. */
export async function loadTermDetail(
  repo: MembershipRepository,
  rawId: string,
): Promise<SectionResult<TermDetail | null>> {
  const termId = parseTermId(rawId);
  if (!termId) return { ok: true, data: null };
  return readSection("term_detail", () => repo.getTermDetail(termId));
}

/** A reference longer than any real order is treated as not found, without a database call. */
export async function loadOrder(
  repo: MembershipRepository,
  reference: string,
): Promise<SectionResult<OrderDetail | null>> {
  if (reference.length > MAX_ORDER_REFERENCE_LENGTH) return { ok: true, data: null };
  return readSection("order", () => repo.findRedemption(reference));
}

export async function loadReport(repo: MembershipRepository, range: ReportRange): Promise<SectionResult<ReportTotals>> {
  if (!range.ok) return { ok: false, message: range.message };
  return readSection("report", () => getMembershipReport(repo, range.from, range.to));
}
