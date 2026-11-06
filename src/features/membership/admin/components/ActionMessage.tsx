import type { JSX } from "react";

import type { AdminActionState } from "@/features/membership/admin/adminActionState";
import { cn } from "@/utils/cn";

/** Result of the last admin action. Errors are announced as alerts, and successes as status updates. */
export function ActionMessage({ state }: { state: AdminActionState }): JSX.Element | null {
  if (state.status === "idle") return null;

  const isError = state.status === "error";
  return (
    <p
      role={isError ? "alert" : "status"}
      className={cn(
        "rounded-2xl border p-4 text-sm",
        isError ? "border-danger/40 bg-danger/10 text-danger" : "border-success/40 bg-success/10 text-success",
      )}
    >
      {state.message}
    </p>
  );
}
