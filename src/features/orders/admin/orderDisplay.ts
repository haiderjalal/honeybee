import type { CustomerOrderStatus } from "@/services/customerOrder.repository";

export const ORDERS_PAGE_SIZE = 25;

export const ORDER_STATUS_LABELS: Record<CustomerOrderStatus, string> = {
  new: "New",
  contacted: "Contacted",
  confirmed: "Confirmed",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

const karachiDateTime = new Intl.DateTimeFormat("en-PK", {
  timeZone: "Asia/Karachi",
  dateStyle: "medium",
  timeStyle: "short",
});

/** Order dates are shown in Pakistan time, where the team works. */
export function formatOrderDate(date: Date): string {
  return karachiDateTime.format(date);
}
