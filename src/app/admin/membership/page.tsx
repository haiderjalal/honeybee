import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { JSX } from "react";

import { Container } from "@/components/layout/Container";
import { AdminSectionNav } from "@/features/membership/admin/components/AdminSectionNav";
import { MemberDetailSection } from "@/features/membership/admin/components/MemberDetailSection";
import { MemberSearchSection } from "@/features/membership/admin/components/MemberSearchSection";
import { OrderLifecycleSection } from "@/features/membership/admin/components/OrderLifecycleSection";
import { PendingPaymentsSection } from "@/features/membership/admin/components/PendingPaymentsSection";
import { ReportSection } from "@/features/membership/admin/components/ReportSection";
import { getAdminContext } from "@/features/membership/admin/adminAccess";
import {
  parseMemberQuery,
  parseReportPeriod,
  readParam,
  type AdminSearchParams,
} from "@/features/membership/admin/adminQuery";
import {
  loadMemberSearch,
  loadOrder,
  loadPendingPayments,
  loadReport,
  loadTermDetail,
} from "@/features/membership/admin/loaders";

/** Every request checks the session, so the admin page is never cached or prerendered. */
export const dynamic = "force-dynamic";

/** Internal admin area. It is never indexed, and the access check runs on every request. */
export const metadata: Metadata = {
  title: "Membership admin",
  robots: { index: false, follow: false },
};

interface AdminMembershipPageProps {
  searchParams: Promise<AdminSearchParams>;
}

export default async function AdminMembershipPage({ searchParams }: AdminMembershipPageProps): Promise<JSX.Element> {
  const access = await getAdminContext();
  // Anyone without admin access, including a deployment with no storage, gets the same 404 as an unknown page.
  if (!access.ok) notFound();

  const { repo, actor } = access.context;
  const params = await searchParams;
  const now = new Date();

  const rawQuery = readParam(params.q);
  const memberQuery = parseMemberQuery(rawQuery);
  const termParam = readParam(params.term);
  const orderParam = readParam(params.order);
  const period = parseReportPeriod(readParam(params.from), readParam(params.to), now);

  const [pending, search, detail, order, report] = await Promise.all([
    loadPendingPayments(repo),
    memberQuery.kind === "search" ? loadMemberSearch(repo, memberQuery.query) : undefined,
    termParam ? loadTermDetail(repo, termParam) : undefined,
    orderParam ? loadOrder(repo, orderParam) : undefined,
    loadReport(repo, period.range),
  ]);

  return (
    <Container className="flex max-w-6xl flex-col gap-8 pt-32 pb-20">
      <header className="flex flex-col gap-4">
        <p className="text-xs font-semibold tracking-[0.3em] text-gold-400 uppercase">The HonyB Hive</p>
        <h1 className="font-display text-4xl text-cream-50 sm:text-5xl">Membership admin</h1>
        <p className="break-all text-cream-300">Signed in as {actor}</p>
        <AdminSectionNav />
      </header>

      <PendingPaymentsSection result={pending} />

      <MemberSearchSection rawQuery={rawQuery} memberQuery={memberQuery} result={search} now={now} />

      {detail ? <MemberDetailSection result={detail} now={now} /> : null}

      <OrderLifecycleSection reference={orderParam} result={order} />

      <ReportSection fromValue={period.fromValue} toValue={period.toValue} result={report} />
    </Container>
  );
}
