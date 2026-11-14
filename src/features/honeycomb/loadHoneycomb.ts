import "server-only";

import { logger } from "@/lib/logger";
import { getCustomerOrderRepository } from "@/lib/supabase/customerOrderRepository";

import { formatHoneycombName } from "./honeycombLayout";

import type { HoneycombCellView } from "./HoneycombWall";

/** The most cells the public wall shows. Older members keep their place; the wall stops growing at this size. */
export const HONEYCOMB_MAX_CELLS = 200;

const joinedDate = new Intl.DateTimeFormat("en-PK", { timeZone: "Asia/Karachi", dateStyle: "medium" });

/**
 * The agreed members for the public wall. If the database is unavailable, the wall shows its invitation alone, so the
 * page still renders and the failure is logged.
 */
export async function loadHoneycombEntries(): Promise<HoneycombCellView[]> {
  const repo = getCustomerOrderRepository();
  if (!repo) return [];

  try {
    const entries = await repo.honeycombEntries(HONEYCOMB_MAX_CELLS);
    return entries.map((entry) => ({
      id: entry.id,
      displayName: entry.displayName ?? formatHoneycombName(entry.customerName),
      joinedOn: joinedDate.format(entry.createdAt),
    }));
  } catch (error) {
    logger.error("Honeycomb could not be loaded; showing the invitation only", { error });
    return [];
  }
}
