import Link from "next/link";
import type { JSX } from "react";

import { adminMembershipHref } from "@/features/membership/admin/adminQuery";
import {
  DISPLAY_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  PURPOSE_LABELS,
  REDEMPTION_STATUS_LABELS,
  TERM_STATUS_LABELS,
  formatAuditAction,
} from "@/features/membership/admin/adminLabels";
import type { SectionResult } from "@/features/membership/admin/loaders";
import { formatMembershipDateTime, formatOptionalMembershipDateTime } from "@/features/membership/admin/adminTime";
import type { TermDetail } from "@/services/membership/membership.repository";
import { getRemainingDiscountAllowance, toCounts } from "@/services/membership/membershipRedemptions";
import { getMembershipDisplayStatus } from "@/services/membership/membershipTerms";
import { formatPkrMinor } from "@/utils/formatPkr";

import { AdminPanel, SubHeading } from "./AdminPanel";
import { AdminTable, adminCellClass, adminHeadCellClass, adminRowClass } from "./AdminTable";
import { CorrectTermForm } from "./CorrectTermForm";
import { FactList } from "./FactList";

interface MemberDetailSectionProps {
  result: SectionResult<TermDetail | null>;
  now: Date;
}

export function MemberDetailSection({ result, now }: MemberDetailSectionProps): JSX.Element {
  return (
    <AdminPanel
      id="member"
      eyebrow="Members"
      title="Membership detail"
      description="The term, its orders and payments, and the change history for one membership."
    >
      <MemberDetailBody result={result} now={now} />
    </AdminPanel>
  );
}

function MemberDetailBody({ result, now }: MemberDetailSectionProps): JSX.Element {
  if (!result.ok) {
    return (
      <p role="alert" className="text-danger">
        {result.message}
      </p>
    );
  }
  if (!result.data) return <p className="text-cream-300">We couldn’t find that membership.</p>;

  const detail = result.data;
  const { term } = detail;
  return (
    <>
      <FactList
        facts={[
          { label: "Phone", value: term.phone },
          { label: "Status", value: DISPLAY_STATUS_LABELS[getMembershipDisplayStatus(term, now)] },
          { label: "Record status", value: TERM_STATUS_LABELS[term.status] },
          { label: "Starts", value: formatMembershipDateTime(term.startsAt) },
          { label: "Expires", value: formatMembershipDateTime(term.expiresAt) },
          {
            label: "Discounts",
            value: `${term.discountsUsed} used, ${term.discountsReserved} reserved, ${term.discountAllowance} in the term`,
          },
          { label: "Discounts left", value: String(getRemainingDiscountAllowance(toCounts(term))) },
        ]}
      />

      <div className="flex flex-col gap-3">
        <SubHeading>Discounted orders</SubHeading>
        {detail.redemptions.length === 0 ? (
          <p className="text-cream-300">No discounted orders on this membership yet.</p>
        ) : (
          <AdminTable caption="Discounted orders on this membership">
            <thead>
              <tr>
                <th scope="col" className={adminHeadCellClass}>
                  Order
                </th>
                <th scope="col" className={adminHeadCellClass}>
                  Status
                </th>
                <th scope="col" className={adminHeadCellClass}>
                  Discount
                </th>
                <th scope="col" className={adminHeadCellClass}>
                  Reversed
                </th>
                <th scope="col" className={adminHeadCellClass}>
                  Refunded
                </th>
                <th scope="col" className={adminHeadCellClass}>
                  Reserved
                </th>
              </tr>
            </thead>
            <tbody>
              {detail.redemptions.map((redemption) => (
                <tr key={redemption.id} className={adminRowClass}>
                  <td className={adminCellClass}>
                    <Link
                      href={adminMembershipHref({ order: redemption.orderReference }, "orders")}
                      className="font-medium text-gold-300 underline-offset-4 hover:underline"
                    >
                      {redemption.orderReference}
                    </Link>
                  </td>
                  <td className={adminCellClass}>{REDEMPTION_STATUS_LABELS[redemption.status]}</td>
                  <td className={adminCellClass}>{formatPkrMinor(redemption.discountMinor)}</td>
                  <td className={adminCellClass}>{formatPkrMinor(redemption.reversedDiscountMinor)}</td>
                  <td className={adminCellClass}>{formatPkrMinor(redemption.refundedPaidMinor)}</td>
                  <td className={adminCellClass}>{formatMembershipDateTime(redemption.reservedAt)}</td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <SubHeading>Membership payments</SubHeading>
        {detail.purchases.length === 0 ? (
          <p className="text-cream-300">No membership payments recorded for this membership.</p>
        ) : (
          <AdminTable caption="Membership payments for this membership">
            <thead>
              <tr>
                <th scope="col" className={adminHeadCellClass}>
                  Purpose
                </th>
                <th scope="col" className={adminHeadCellClass}>
                  Status
                </th>
                <th scope="col" className={adminHeadCellClass}>
                  Amount
                </th>
                <th scope="col" className={adminHeadCellClass}>
                  Created
                </th>
                <th scope="col" className={adminHeadCellClass}>
                  Verified
                </th>
              </tr>
            </thead>
            <tbody>
              {detail.purchases.map((purchase) => (
                <tr key={purchase.id} className={adminRowClass}>
                  <td className={adminCellClass}>{PURPOSE_LABELS[purchase.purpose]}</td>
                  <td className={adminCellClass}>{PAYMENT_STATUS_LABELS[purchase.status]}</td>
                  <td className={adminCellClass}>{formatPkrMinor(purchase.amountMinor)}</td>
                  <td className={adminCellClass}>{formatMembershipDateTime(purchase.createdAt)}</td>
                  <td className={adminCellClass}>{formatOptionalMembershipDateTime(purchase.verifiedAt)}</td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <SubHeading>Change history</SubHeading>
        {detail.audit.length === 0 ? (
          <p className="text-cream-300">No changes recorded yet.</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {detail.audit.map((event, index) => (
              <li
                key={`${index}-${event.action}`}
                className="rounded-2xl border border-cream-50/10 bg-forest-950/40 p-4"
              >
                <p className="font-medium text-cream-50">{formatAuditAction(event.action)}</p>
                <p className="text-sm text-cream-300">
                  {formatMembershipDateTime(event.createdAt)} by {event.actor}
                </p>
                <p className="mt-1 text-sm text-cream-100">Reason: {event.reason}</p>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="flex flex-col gap-4 border-t border-cream-50/10 pt-6">
        <SubHeading>Correct this membership</SubHeading>
        <p className="text-sm text-cream-300">
          Leave a field blank to keep it as it is. Every correction needs a reason, which is recorded in the audit log.
        </p>
        <CorrectTermForm
          termId={term.id}
          allowance={term.discountAllowance}
          currentExpiry={formatMembershipDateTime(term.expiresAt)}
          currentDiscountsUsed={term.discountsUsed}
        />
      </div>
    </>
  );
}
