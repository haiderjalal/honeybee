/** Result of an admin server action. Shared by the actions and the client forms that display it. */

export type AdminActionStatus = "idle" | "ok" | "error";

export interface AdminActionState {
  status: AdminActionStatus;
  message: string;
}

/** Starting state for every admin form. */
export const ADMIN_ACTION_IDLE: AdminActionState = { status: "idle", message: "" };
