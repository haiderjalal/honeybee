import { Button } from "@/components/ui/Button";
import { InputField, SelectField } from "@/components/ui/Field";
import { ROUTES } from "@/constants/routes";
import { CUSTOMER_ORDER_STATUSES, type CustomerOrderStatus } from "@/services/customerOrder.repository";

import { ORDER_STATUS_LABELS } from "./orderDisplay";

import type { JSX } from "react";

interface OrderSearchFormProps {
  query: string;
  status: CustomerOrderStatus | undefined;
}

/** A plain GET form. The search is a page address, so it can be bookmarked and shared inside the team. */
export function OrderSearchForm({ query, status }: OrderSearchFormProps): JSX.Element {
  return (
    <form action={ROUTES.adminOrders} method="get" className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="flex-1">
        <InputField
          id="order-search"
          name="q"
          label="Find an order by number"
          hint="Part of the order number, such as 7K2Q. Leave empty to see all orders."
          defaultValue={query}
          autoComplete="off"
        />
      </div>
      <div className="sm:w-56">
        <SelectField id="order-status-filter" name="status" label="Status" defaultValue={status ?? ""}>
          <option value="">All statuses</option>
          {CUSTOMER_ORDER_STATUSES.map((value) => (
            <option key={value} value={value}>
              {ORDER_STATUS_LABELS[value]}
            </option>
          ))}
        </SelectField>
      </div>
      <Button type="submit" variant="secondary" className="sm:mb-0">
        Search
      </Button>
    </form>
  );
}
