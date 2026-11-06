import type { JSX, ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/Field";
import { ROUTES } from "@/constants/routes";
import { REPORT_WINDOW_DAYS } from "@/features/membership/admin/adminConstants";
import type { SectionResult } from "@/features/membership/admin/loaders";
import type { ReportTotals } from "@/services/membership/membership.repository";
import { formatPkrMinor } from "@/utils/formatPkr";

import { AdminPanel, SubHeading } from "./AdminPanel";

interface ReportSectionProps {
  fromValue: string;
  toValue: string;
  result: SectionResult<ReportTotals>;
}

export function ReportSection({ fromValue, toValue, result }: ReportSectionProps): JSX.Element {
  return (
    <AdminPanel
      id="reporting"
      eyebrow="Reporting"
      title="Membership reporting"
      description={`Fees and discounts for the chosen dates, in membership time (UTC+5). The default covers the last ${REPORT_WINDOW_DAYS} days.`}
    >
      <form method="get" action={ROUTES.adminMembership} className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <InputField id="report-from" name="from" type="date" label="From" defaultValue={fromValue} />
        <InputField id="report-to" name="to" type="date" label="To" defaultValue={toValue} />
        <Button type="submit" variant="secondary">
          Update report
        </Button>
      </form>

      {result.ok ? (
        <ReportFigures totals={result.data} />
      ) : (
        <p role="alert" className="text-danger">
          {result.message}
        </p>
      )}

      <p className="rounded-2xl border border-cream-50/10 bg-forest-950/40 p-4 text-cream-100">
        Fees are not profit. They are shown separately from product sales.
      </p>
      <p className="text-sm text-cream-500">
        Fees count in the period they were verified. Orders and discounts count in the period they were reserved.
      </p>
    </AdminPanel>
  );
}

function ReportFigures({ totals }: { totals: ReportTotals }): JSX.Element {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <FigureGroup title="Membership fees">
        <Figure
          label="Membership fees collected (not profit)"
          value={formatPkrMinor(totals.feesCollectedMinor)}
          note={`${totals.feePayments} verified ${totals.feePayments === 1 ? "payment" : "payments"}`}
        />
      </FigureGroup>

      <FigureGroup title="Membership discounts">
        <Figure label="Discounts granted on fulfilled orders" value={formatPkrMinor(totals.discountsGrantedMinor)} />
        <Figure label="Discounts reversed by refunds" value={formatPkrMinor(totals.discountsReversedMinor)} />
        <Figure
          label="Net membership discount cost"
          value={formatPkrMinor(totals.netDiscountCostMinor)}
          note="Granted minus reversed."
        />
        <Figure label="Discounts reserved for pending orders" value={formatPkrMinor(totals.discountsReservedMinor)} />
      </FigureGroup>

      <FigureGroup title="Member orders">
        <Figure label="Fulfilled" value={String(totals.memberOrdersFulfilled)} />
        <Figure label="Pending" value={String(totals.memberOrdersPending)} note="Reserved, not yet fulfilled." />
        <Figure label="Released" value={String(totals.memberOrdersReleased)} />
      </FigureGroup>

      <FigureGroup title="Refunds">
        <Figure
          label="Total refunded"
          value={formatPkrMinor(totals.refundsMinor)}
          note="Amount paid for returned jars."
        />
        <Figure label="Orders refunded" value={String(totals.refundedOrders)} />
      </FigureGroup>
    </div>
  );
}

function FigureGroup({ title, children }: { title: string; children: ReactNode }): JSX.Element {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-cream-50/10 bg-forest-950/40 p-5">
      <SubHeading>{title}</SubHeading>
      <dl className="flex flex-col gap-4">{children}</dl>
    </div>
  );
}

function Figure({ label, value, note }: { label: string; value: string; note?: string }): JSX.Element {
  return (
    <>
      <dt className="text-sm text-cream-300">{label}</dt>
      <dd className="font-display text-2xl text-gold-300 tabular-nums">{value}</dd>
      {note ? <dd className="-mt-3 text-xs text-cream-500">{note}</dd> : null}
    </>
  );
}
