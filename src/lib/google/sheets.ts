import "server-only";

const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";
const APPEND_TIMEOUT_MS = 5000;

export interface SheetTarget {
  sheetId: string;
  /** Tab name, e.g. "Orders". */
  tab: string;
  getAccessToken: () => Promise<string>;
  fetcher?: typeof fetch;
}

/**
 * Appends one row to the end of the tab. RAW input stores every value as typed, so a value such as
 * "=HYPERLINK(...)" is kept as text instead of being evaluated as a formula.
 *
 * Not retried: a timed-out append may already have been written, and a retry would duplicate the row.
 */
export async function appendSheetRow(target: SheetTarget, values: (string | number)[]): Promise<void> {
  const token = await target.getAccessToken();
  const range = encodeURIComponent(`${target.tab}!A1`);
  const url = `${SHEETS_API}/${encodeURIComponent(target.sheetId)}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;

  const response = await (target.fetcher ?? fetch)(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ values: [values] }),
    signal: AbortSignal.timeout(APPEND_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Google Sheets append failed with HTTP ${response.status}`);
}
