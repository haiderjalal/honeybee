import { formatPkrMinor } from "@/utils/formatPkr";

import { formatAccountDate, MEMBERSHIP_STATUS_COPY } from "../accountCopy";

import { AccountPanel } from "./AccountPanel";
import { DetailItem } from "./DetailItem";

import type { ReactElement } from "react";
import type { AccountView } from "@/services/membership/membership.service";
import type { StoredTerm } from "@/services/membership/membership.repository";
import type { MembershipDisplayStatus } from "@/types/membership";

interface MembershipStatusPanelProps {
  status: MembershipDisplayStatus;
  term: StoredTerm | null;
  allowance: AccountView["allowance"];
  savingsMinor: number;
}

/** Status, term dates, the discount allowance and savings. Savings only count fulfilled orders, after refunds. */
export function MembershipStatusPanel({
  status,
  term,
  allowance,
  savingsMinor,
}: MembershipStatusPanelProps): ReactElement {
  const copy = MEMBERSHIP_STATUS_COPY[status];

  return (
    <AccountPanel id="status-title" title="Status and savings">
      <div className="flex flex-col gap-2">
        <p className="font-display text-3xl text-gold-300">{copy.label}</p>
        <p className="text-cream-300">{copy.summary}</p>
      </div>

      {term ? (
        <dl className="grid gap-4 sm:grid-cols-2">
          <DetailItem label="Activated on" value={formatAccountDate(term.startsAt)} />
          <DetailItem
            label={status === "expired" ? "Expired on" : "Expires on"}
            value={formatAccountDate(term.expiresAt)}
          />
        </dl>
      ) : null}

      {allowance ? (
        <div className="flex flex-col gap-4 border-t border-cream-50/10 pt-6">
          <p className="text-cream-100">
            {allowance.remaining} of {allowance.total} discounted orders remaining
          </p>
          <dl className="grid grid-cols-3 gap-4">
            <DetailItem label="Used" value={String(allowance.used)} />
            <DetailItem label="Reserved" value={String(allowance.reserved)} />
            <DetailItem label="Remaining" value={String(allowance.remaining)} />
          </dl>
          <p className="text-sm text-cream-500">Reserved orders count until they are fulfilled or released.</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 border-t border-cream-50/10 pt-6">
        <p className="text-cream-300">Savings from fulfilled orders, after refunds</p>
        <p className="font-display text-4xl text-cream-50 tabular-nums">{formatPkrMinor(savingsMinor)}</p>
        <p className="text-sm text-cream-500">Reserved and released orders are not counted.</p>
      </div>
    </AccountPanel>
  );
}
