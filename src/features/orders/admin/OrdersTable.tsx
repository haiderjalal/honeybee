import Link from "next/link";

import { formatPkrMinor } from "@/utils/formatPkr";
import { ROUTES } from "@/constants/routes";
import type { CustomerOrderSummary } from "@/services/customerOrder.repository";

import { ORDERS_PAGE_SIZE, ORDER_STATUS_LABELS, formatOrderDate } from "./orderDisplay";
import { ordersHref } from "./orderQuery";

import type { JSX } from "react";

interface OrdersTableProps {
  rows: readonly CustomerOrderSummary[];
  total: number;
  page: number;
  query: string;
  status: CustomerOrderSummary["status"] | undefined;
  selected: string | undefined;
}

/** The newest orders first, with the current search kept when a row is opened or the page changes. */
export function OrdersTable({ rows, total, page, query, status, selected }: OrdersTableProps): JSX.Element {
  const lastPage = Math.max(1, Math.ceil(total / ORDERS_PAGE_SIZE));
  const base = { query, status, selected };

  if (rows.length === 0) {
    return <p className="text-cream-300">No orders match this search.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-cream-500">
        {total} {total === 1 ? "order" : "orders"}
        {total > 0 ? `, page ${page} of ${lastPage}` : ""}
      </p>

      <div className="overflow-x-auto rounded-3xl border border-cream-50/10">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-forest-800/60 text-xs tracking-[0.15em] text-cream-500 uppercase">
            <tr>
              <th scope="col" className="px-4 py-3">
                Order
              </th>
              <th scope="col" className="px-4 py-3">
                Placed
              </th>
              <th scope="col" className="px-4 py-3">
                Customer
              </th>
              <th scope="col" className="px-4 py-3">
                City
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Total
              </th>
              <th scope="col" className="px-4 py-3">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-50/10">
            {rows.map((row) => (
              <tr key={row.reference} className={row.reference === selected ? "bg-forest-800/50" : undefined}>
                <td className="px-4 py-3">
                  <Link
                    href={ordersHref(ROUTES.adminOrders, { ...base, page, selected: row.reference })}
                    className="font-medium text-gold-300 hover:underline"
                  >
                    {row.reference}
                  </Link>
                  {row.membershipDiscountMinor > 0 ? (
                    <span className="ml-2 rounded-full border border-gold-400/40 px-2 py-0.5 text-xs text-gold-300">
                      Member
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-cream-300">{formatOrderDate(row.createdAt)}</td>
                <td className="px-4 py-3 text-cream-100">{row.customerName}</td>
                <td className="px-4 py-3 text-cream-300">{row.city}</td>
                <td className="px-4 py-3 text-right text-cream-100 tabular-nums">{formatPkrMinor(row.totalMinor)}</td>
                <td className="px-4 py-3 text-cream-100">{ORDER_STATUS_LABELS[row.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <nav aria-label="Order pages" className="flex items-center justify-between gap-4">
        {page > 1 ? (
          <Link
            href={ordersHref(ROUTES.adminOrders, { ...base, page: page - 1 })}
            className="rounded-full border border-cream-50/15 px-4 py-2 text-sm text-cream-100 hover:border-gold-300"
          >
            Previous
          </Link>
        ) : (
          <span />
        )}
        {page < lastPage ? (
          <Link
            href={ordersHref(ROUTES.adminOrders, { ...base, page: page + 1 })}
            className="rounded-full border border-cream-50/15 px-4 py-2 text-sm text-cream-100 hover:border-gold-300"
          >
            Next
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
