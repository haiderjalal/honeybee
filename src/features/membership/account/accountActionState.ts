/**
 * Result shape for the membership account forms. Kept out of `actions.ts`, because a "use server" file may only
 * export async functions, while the idle state is a plain value used by the client forms.
 */
export type AccountActionState =
  { status: "idle"; message: "" } | { status: "success"; message: string } | { status: "error"; message: string };

export const ACCOUNT_ACTION_IDLE: AccountActionState = { status: "idle", message: "" };
