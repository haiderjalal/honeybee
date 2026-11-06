import { MEMBERSHIP } from "@/constants/membership";

import { formatAccountDate, TERM_TEXT } from "../accountCopy";

import { AccountPanel } from "./AccountPanel";
import { StartFeePurchaseForm } from "./StartFeePurchaseForm";

import type { ReactElement } from "react";
import type { PurchaseStartDecision } from "@/types/membership";

interface StartMembershipPanelProps {
  decision: PurchaseStartDecision;
  /** The current term's expiry, used to explain when a renewal opens. */
  expiresAt: Date | null;
  salesOpen: boolean;
}

/**
 * Join or renew. Returns nothing when a payment is already open (shown separately), and when the membership is
 * suspended or cancelled (the status panel explains that).
 */
export function StartMembershipPanel({
  decision,
  expiresAt,
  salesOpen,
}: StartMembershipPanelProps): ReactElement | null {
  if (decision.ok) {
    const isRenewal = decision.purpose === "renewal";

    return (
      <AccountPanel id="start-title" title={isRenewal ? "Renew your membership" : `Join ${MEMBERSHIP.name}`}>
        <p className="text-cream-300">
          {isRenewal
            ? `A renewal starts a new ${TERM_TEXT} once we have verified your payment.`
            : `Your ${TERM_TEXT} starts once we have verified your payment.`}
        </p>
        <StartFeePurchaseForm purpose={decision.purpose} salesOpen={salesOpen} />
      </AccountPanel>
    );
  }

  if (decision.reason === "already_active" && expiresAt) {
    return (
      <AccountPanel id="start-title" title="Renewal">
        <p className="text-cream-300">You can renew once your current term ends on {formatAccountDate(expiresAt)}.</p>
      </AccountPanel>
    );
  }

  return null;
}
