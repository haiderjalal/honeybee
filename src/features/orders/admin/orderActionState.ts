/** Result of an order action. Kept out of the "use server" module, which may export only async actions. */
export interface OrderActionState {
  status: "idle" | "ok" | "error";
  message: string;
}

export const ORDER_ACTION_IDLE: OrderActionState = { status: "idle", message: "" };
