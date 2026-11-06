import Link from "next/link";
import type { JSX } from "react";

import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/Field";
import { ROUTES } from "@/constants/routes";
import { MIN_SEARCH_DIGITS } from "@/features/membership/admin/adminConstants";
import { DISPLAY_STATUS_LABELS } from "@/features/membership/admin/adminLabels";
import { adminMembershipHref, type MemberQuery } from "@/features/membership/admin/adminQuery";
import type { SectionResult } from "@/features/membership/admin/loaders";
import { formatMembershipDate } from "@/features/membership/admin/adminTime";
import type { StoredTerm } from "@/services/membership/membership.repository";
import { getMembershipDisplayStatus } from "@/services/membership/membershipTerms";

import { AdminPanel } from "./AdminPanel";
import { AdminTable, adminCellClass, adminHeadCellClass, adminRowClass } from "./AdminTable";

interface MemberSearchSectionProps {
  rawQuery: string;
  memberQuery: MemberQuery;
  result: SectionResult<StoredTerm[]> | undefined;
  now: Date;
}

export function MemberSearchSection({ rawQuery, memberQuery, result, now }: MemberSearchSectionProps): JSX.Element {
  return (
    <AdminPanel
      id="members"
      eyebrow="Members"
      title="Member search"
      description="Search by the last digits of a phone number, or by a full account ID."
    >
      <form
        method="get"
        action={ROUTES.adminMembership}
        role="search"
        className="flex flex-col gap-4 sm:flex-row sm:items-end"
      >
        <InputField
          id="member-query"
          name="q"
          label="Phone number or account ID"
          hint={`At least ${MIN_SEARCH_DIGITS} digits, or a full account ID.`}
          defaultValue={rawQuery}
          autoComplete="off"
          spellCheck={false}
          className="sm:max-w-md"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      <MemberSearchResults memberQuery={memberQuery} result={result} now={now} />
    </AdminPanel>
  );
}

function MemberSearchResults({
  memberQuery,
  result,
  now,
}: Pick<MemberSearchSectionProps, "memberQuery" | "result" | "now">): JSX.Element {
  if (memberQuery.kind === "none") {
    return <p className="text-cream-300">Search to find a membership and open its details.</p>;
  }
  if (memberQuery.kind === "invalid") {
    return (
      <p role="alert" className="text-danger">
        {memberQuery.message}
      </p>
    );
  }
  if (!result) return <p className="text-cream-300">Search to find a membership and open its details.</p>;
  if (!result.ok) {
    return (
      <p role="alert" className="text-danger">
        {result.message}
      </p>
    );
  }
  if (result.data.length === 0) return <p className="text-cream-300">No memberships match that search.</p>;

  return (
    <AdminTable caption="Matching memberships">
      <thead>
        <tr>
          <th scope="col" className={adminHeadCellClass}>
            Phone
          </th>
          <th scope="col" className={adminHeadCellClass}>
            Status
          </th>
          <th scope="col" className={adminHeadCellClass}>
            Starts
          </th>
          <th scope="col" className={adminHeadCellClass}>
            Expires
          </th>
          <th scope="col" className={adminHeadCellClass}>
            Discounts
          </th>
          <th scope="col" className={adminHeadCellClass}>
            <span className="sr-only">Open</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {result.data.map((term) => (
          <tr key={term.id} className={adminRowClass}>
            <td className={adminCellClass}>{term.phone}</td>
            <td className={adminCellClass}>{DISPLAY_STATUS_LABELS[getMembershipDisplayStatus(term, now)]}</td>
            <td className={adminCellClass}>{formatMembershipDate(term.startsAt)}</td>
            <td className={adminCellClass}>{formatMembershipDate(term.expiresAt)}</td>
            <td className={adminCellClass}>
              {term.discountsUsed} used, {term.discountsReserved} reserved of {term.discountAllowance}
            </td>
            <td className={adminCellClass}>
              <Link
                href={adminMembershipHref({ term: term.id }, "member")}
                className="font-medium text-gold-300 underline-offset-4 hover:underline"
              >
                View membership
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </AdminTable>
  );
}
