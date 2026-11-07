import { CUSTOMER_ORDER_STATUSES, type CustomerOrderStatus } from "@/services/customerOrder.repository";

import { ORDERS_PAGE_SIZE } from "./orderDisplay";

type RawParams = Record<string, string | string[] | undefined>;

export interface OrderListQuery {
  /** Part of an order number. Only letters, digits and dashes are kept, so the search is safe to pass on. */
  query: string;
  status: CustomerOrderStatus | undefined;
  page: number;
  offset: number;
  /** The order open in the detail panel, if any. */
  selected: string | undefined;
}

const first = (value: string | string[] | undefined): string => {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw ?? "").trim();
};

/** Reads the admin page's query string. Everything here is untrusted input. */
export function parseOrderQuery(params: RawParams): OrderListQuery {
  const query = first(params.q)
    .replace(/[^A-Za-z0-9-]/g, "")
    .slice(0, 40)
    .toUpperCase();
  const statusValue = first(params.status);
  const status = (CUSTOMER_ORDER_STATUSES as readonly string[]).includes(statusValue)
    ? (statusValue as CustomerOrderStatus)
    : undefined;
  const parsedPage = Number.parseInt(first(params.page), 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const selected =
    first(params.order)
      .replace(/[^A-Za-z0-9-]/g, "")
      .slice(0, 40)
      .toUpperCase() || undefined;

  return { query, status, page, offset: (page - 1) * ORDERS_PAGE_SIZE, selected };
}

/** Builds an Orders page link that keeps the current search, status and page. */
export function ordersHref(
  base: string,
  options: { query?: string; status?: CustomerOrderStatus; page?: number; selected?: string },
): string {
  const search = new URLSearchParams();
  if (options.query) search.set("q", options.query);
  if (options.status) search.set("status", options.status);
  if (options.page && options.page > 1) search.set("page", String(options.page));
  if (options.selected) search.set("order", options.selected);
  const queryString = search.toString();
  return queryString ? `${base}?${queryString}` : base;
}
