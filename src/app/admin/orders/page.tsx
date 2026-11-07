import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { JSX } from "react";

import { Container } from "@/components/layout/Container";
import { ROUTES } from "@/constants/routes";
import { OrderDetailPanel } from "@/features/orders/admin/OrderDetailPanel";
import { OrderSearchForm } from "@/features/orders/admin/OrderSearchForm";
import { OrdersTable } from "@/features/orders/admin/OrdersTable";
import { ORDERS_PAGE_SIZE } from "@/features/orders/admin/orderDisplay";
import { parseOrderQuery } from "@/features/orders/admin/orderQuery";
import { getMembershipAdmin } from "@/lib/membership/access";
import { getCustomerOrderRepository } from "@/lib/supabase/customerOrderRepository";

/** Every request checks the admin, so this page is never cached or prerendered. */
export const dynamic = "force-dynamic";

/** Internal admin area. It is never indexed. */
export const metadata: Metadata = {
  title: "Customer orders",
  robots: { index: false, follow: false },
};

interface AdminOrdersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps): Promise<JSX.Element> {
  // Anyone without admin access gets the same 404 as an unknown page.
  const admin = await getMembershipAdmin();
  const repo = getCustomerOrderRepository();
  if (!admin || !repo) notFound();

  const query = parseOrderQuery(await searchParams);
  const [list, detail] = await Promise.all([
    repo.search({ query: query.query, status: query.status, limit: ORDERS_PAGE_SIZE, offset: query.offset }),
    query.selected ? repo.get(query.selected) : Promise.resolve(null),
  ]);

  return (
    <Container className="flex max-w-6xl flex-col gap-10 pt-32 pb-20">
      <header className="flex flex-col gap-4">
        <p className="text-xs font-semibold tracking-[0.3em] text-gold-400 uppercase">The HonyB Hive</p>
        <h1 className="font-display text-4xl text-cream-50 sm:text-5xl">Customer orders</h1>
        <p className="break-all text-cream-300">Signed in as {admin.email ?? admin.id}</p>
        <nav aria-label="Admin areas">
          <ul className="flex flex-wrap gap-2">
            <li>
              <Link
                href={ROUTES.adminMembership}
                className="inline-flex min-h-10 items-center rounded-full border border-cream-50/15 px-4 text-sm text-cream-100 hover:border-gold-300 hover:text-gold-300"
              >
                Membership
              </Link>
            </li>
            <li>
              <span
                aria-current="page"
                className="inline-flex min-h-10 items-center rounded-full border border-gold-400/50 px-4 text-sm text-gold-300"
              >
                Orders
              </span>
            </li>
          </ul>
        </nav>
      </header>

      <section aria-labelledby="order-list-title" className="flex flex-col gap-6">
        <h2 id="order-list-title" className="sr-only">
          Order list
        </h2>
        <OrderSearchForm query={query.query} status={query.status} />
        <OrdersTable
          rows={list.rows}
          total={list.total}
          page={query.page}
          query={query.query}
          status={query.status}
          selected={query.selected}
        />
      </section>

      {detail ? <OrderDetailPanel order={detail} /> : null}
      {query.selected && !detail ? (
        <p className="text-cream-300">We couldn&apos;t find order {query.selected}.</p>
      ) : null}
    </Container>
  );
}
