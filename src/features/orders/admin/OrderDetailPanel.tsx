import { formatPkrMinor } from "@/utils/formatPkr";
import type { CustomerOrderDetail } from "@/services/customerOrder.repository";

import { HoneycombToggleForm } from "./HoneycombToggleForm";
import { OrderStatusForm } from "./OrderStatusForm";
import { ORDER_STATUS_LABELS, formatOrderDate } from "./orderDisplay";

import type { JSX } from "react";

interface OrderDetailPanelProps {
  order: CustomerOrderDetail;
}

/** Everything the team needs to act on one order: the customer, the jars, the totals and the status. */
export function OrderDetailPanel({ order }: OrderDetailPanelProps): JSX.Element {
  const contact: [string, string | null][] = [
    ["Name", order.customerName],
    ["Phone", order.phone],
    ["Email", order.email],
    ["City", order.city],
    ["Address", order.address],
    ["Referred by", order.referral],
    ["Notes", order.notes],
  ];

  return (
    <section
      aria-labelledby="order-detail-title"
      className="flex flex-col gap-8 rounded-3xl border border-gold-400/20 bg-forest-900/60 p-6 sm:p-8"
    >
      <header className="flex flex-col gap-2">
        <h2 id="order-detail-title" className="font-display text-3xl text-cream-50">
          Order {order.reference}
        </h2>
        <p className="text-sm text-cream-500">
          Placed {formatOrderDate(order.createdAt)} · Status: {ORDER_STATUS_LABELS[order.status]}
        </p>
      </header>

      <dl className="grid gap-3 sm:grid-cols-2">
        {contact
          .filter((entry): entry is [string, string] => Boolean(entry[1]))
          .map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1">
              <dt className="text-xs tracking-[0.15em] text-cream-500 uppercase">{label}</dt>
              <dd className="whitespace-pre-line text-cream-100">{value}</dd>
            </div>
          ))}
      </dl>

      <div className="overflow-x-auto rounded-2xl border border-cream-50/10">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="bg-forest-800/60 text-xs tracking-[0.15em] text-cream-500 uppercase">
            <tr>
              <th scope="col" className="px-4 py-3">
                Jar
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Qty
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Each
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Line total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-50/10">
            {order.items.map((item) => (
              <tr key={item.lineKey}>
                <td className="px-4 py-3 text-cream-100">
                  {item.name} · {item.sizeLabel}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{item.quantity}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatPkrMinor(item.unitPriceMinor)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatPkrMinor(item.lineTotalMinor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="ml-auto grid min-w-[16rem] gap-2 text-right">
        <div className="flex justify-between gap-6">
          <dt className="text-cream-300">Subtotal</dt>
          <dd className="tabular-nums">{formatPkrMinor(order.subtotalMinor)}</dd>
        </div>
        {order.membershipDiscountMinor > 0 ? (
          <div className="flex justify-between gap-6">
            <dt className="text-cream-300">Member discount</dt>
            <dd className="tabular-nums">− {formatPkrMinor(order.membershipDiscountMinor)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-6 border-t border-cream-50/10 pt-2">
          <dt className="text-cream-100">Total to confirm</dt>
          <dd className="font-display text-2xl text-gold-300 tabular-nums">{formatPkrMinor(order.totalMinor)}</dd>
        </div>
      </dl>

      <div className="border-t border-cream-50/10 pt-6">
        <h3 className="mb-4 font-display text-2xl text-cream-50">Update status</h3>
        <OrderStatusForm reference={order.reference} currentStatus={order.status} />
      </div>

      <div className="border-t border-cream-50/10 pt-6">
        <h3 className="mb-4 font-display text-2xl text-cream-50">Honeycomb</h3>
        <HoneycombToggleForm reference={order.reference} shown={order.showOnHoneycomb} />
      </div>
    </section>
  );
}
