import "server-only";

import { CustomerOrderRepository } from "@/services/customerOrder.repository";

import { createServiceRoleRpcCaller } from "./serviceRpc";

let cached: CustomerOrderRepository | null | undefined;

/** The customer orders repository, or null while Supabase is not configured. */
export function getCustomerOrderRepository(): CustomerOrderRepository | null {
  if (cached === undefined) {
    const rpc = createServiceRoleRpcCaller();
    cached = rpc ? new CustomerOrderRepository(rpc) : null;
  }
  return cached;
}
