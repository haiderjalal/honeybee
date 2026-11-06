import type { JSX } from "react";

import type { SectionResult } from "@/features/membership/admin/loaders";
import { PURPOSE_LABELS } from "@/features/membership/admin/adminLabels";
import { formatMembershipDateTime } from "@/features/membership/admin/adminTime";
import type { PendingPayment } from "@/services/membership/membership.repository";
import { formatPkrMinor } from "@/utils/formatPkr";

import { AdminPanel } from "./AdminPanel";
import { PendingPaymentsPanel, type PendingPaymentRow } from "./PendingPaymentsPanel";

interface PendingPaymentsSectionProps {
  result: SectionResult<PendingPayment[]>;
}

export function PendingPaymentsSection({ result }: PendingPaymentsSectionProps): JSX.Element {
  return (
    <AdminPanel
      id="pending"
      eyebrow="Payments"
      title="Pending payments"
      description="Membership fees waiting for a check against the bank."
    >
      <p className="rounded-2xl border border-gold-400/40 bg-gold-400/10 p-4 text-cream-100">
        <strong className="font-semibold text-gold-300">
          Verify only after matching the transfer on your bank statement.
        </strong>{" "}
        A screenshot or the customer’s reference alone is not proof.
      </p>

      {result.ok ? (
        <PendingPaymentsPanel rows={result.data.map(toPendingRow)} />
      ) : (
        <p role="alert" className="text-danger">
          {result.message}
        </p>
      )}
    </AdminPanel>
  );
}

function toPendingRow(payment: PendingPayment): PendingPaymentRow {
  return {
    id: payment.id,
    phone: payment.phone,
    purposeLabel: PURPOSE_LABELS[payment.purpose],
    amountLabel: formatPkrMinor(payment.amountMinor),
    customerReference: payment.customerReference ?? "",
    createdLabel: formatMembershipDateTime(payment.createdAt),
  };
}
