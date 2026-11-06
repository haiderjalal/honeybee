import Link from "next/link";
import type { JSX } from "react";

import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/Field";
import { ROUTES } from "@/constants/routes";
import { REDEMPTION_STATUS_LABELS } from "@/features/membership/admin/adminLabels";
import { adminMembershipHref } from "@/features/membership/admin/adminQuery";
import type { OrderDetail, SectionResult } from "@/features/membership/admin/loaders";
import { formatMembershipDateTime, formatOptionalMembershipDateTime } from "@/features/membership/admin/adminTime";
import { formatPkrMinor } from "@/utils/formatPkr";

import { AdminPanel, SubHeading } from "./AdminPanel";
import { AdminTable, adminCellClass, adminHeadCellClass, adminRowClass } from "./AdminTable";
import { FactList } from "./FactList";
import { OrderActions } from "./OrderActions";

interface OrderLifecycleSectionProps {
  /** The reference typed in the lookup, shown back in the input. */
  reference: string;
  /** Undefined until an order has been looked up. */
  result: SectionResult<OrderDetail | null> | undefined;
}

export function OrderLifecycleSection({ reference, result }: OrderLifecycleSectionProps): JSX.Element {
  return (
    <AdminPanel
      id="orders"
      eyebrow="Orders"
      title="Order lifecycle"
      description="Find a member order by its reference, then fulfil, release or refund it."
    >
      <form
        method="get"
        action={ROUTES.adminMembership}
        role="search"
        className="flex flex-col gap-4 sm:flex-row sm:items-end"
      >
        <InputField
          id="order-reference"
          name="order"
          label="Order reference"
          defaultValue={reference}
          autoComplete="off"
          spellCheck={false}
          className="sm:max-w-md"
        />
        <Button type="submit" variant="secondary">
          Find order
        </Button>
      </form>

      {result ? <OrderBody result={result} /> : null}
    </AdminPanel>
  );
}

function OrderBody({ result }: { result: SectionResult<OrderDetail | null> }): JSX.Element {
  if (!result.ok) {
    return (
      <p role="alert" className="text-danger">
        {result.message}
      </p>
    );
  }
  if (!result.data) return <p className="text-cream-300">No member order matches that reference.</p>;

  const { redemption, lines } = result.data;
  return (
    <>
      <FactList
        facts={[
          { label: "Order reference", value: redemption.orderReference },
          { label: "Status", value: REDEMPTION_STATUS_LABELS[redemption.status] },
          { label: "Eligible subtotal", value: formatPkrMinor(redemption.eligibleSubtotalMinor) },
          { label: "Discount on this order", value: formatPkrMinor(redemption.discountMinor) },
          { label: "Reversed by refunds", value: formatPkrMinor(redemption.reversedDiscountMinor) },
          { label: "Paid amount refunded", value: formatPkrMinor(redemption.refundedPaidMinor) },
          { label: "Reserved", value: formatMembershipDateTime(redemption.reservedAt) },
          { label: "Fulfilled", value: formatOptionalMembershipDateTime(redemption.consumedAt) },
          { label: "Released", value: formatOptionalMembershipDateTime(redemption.releasedAt) },
          { label: "Fully refunded", value: formatOptionalMembershipDateTime(redemption.restoredAt) },
          {
            label: "Membership",
            value: (
              <Link
                href={adminMembershipHref({ term: redemption.termId }, "member")}
                className="font-medium text-gold-300 underline-offset-4 hover:underline"
              >
                View membership
              </Link>
            ),
          },
        ]}
      />

      <div className="flex flex-col gap-3">
        <SubHeading>Jars on this order</SubHeading>
        <AdminTable caption="Jars on this order">
          <thead>
            <tr>
              <th scope="col" className={adminHeadCellClass}>
                Jar
              </th>
              <th scope="col" className={adminHeadCellClass}>
                Ordered
              </th>
              <th scope="col" className={adminHeadCellClass}>
                Refunded
              </th>
              <th scope="col" className={adminHeadCellClass}>
                Still refundable
              </th>
              <th scope="col" className={adminHeadCellClass}>
                Line total
              </th>
              <th scope="col" className={adminHeadCellClass}>
                Membership discount
              </th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.lineKey} className={adminRowClass}>
                <td className={adminCellClass}>{line.lineKey}</td>
                <td className={adminCellClass}>{line.quantity}</td>
                <td className={adminCellClass}>{line.refundedQuantity}</td>
                <td className={adminCellClass}>{Math.max(0, line.quantity - line.refundedQuantity)}</td>
                <td className={adminCellClass}>{formatPkrMinor(line.lineTotalMinor)}</td>
                <td className={adminCellClass}>{formatPkrMinor(line.discountMinor)}</td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      </div>

      <div className="flex flex-col gap-4 border-t border-cream-50/10 pt-6">
        <SubHeading>Actions</SubHeading>
        <OrderActions
          key={redemption.orderReference}
          orderReference={redemption.orderReference}
          status={redemption.status}
          lines={lines.map((line) => ({
            lineKey: line.lineKey,
            refundableQuantity: Math.max(0, line.quantity - line.refundedQuantity),
          }))}
        />
      </div>
    </>
  );
}
