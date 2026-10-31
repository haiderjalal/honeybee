const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** Single-line field: strips control characters (incl. CR/LF) and collapses whitespace. */
export function sanitizeLine(value: string): string {
  return value.replace(CONTROL_CHARS, "").replace(/\s+/g, " ").trim();
}

/** Multi-line field: strips control characters but keeps line breaks. */
export function sanitizeMultiline(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(CONTROL_CHARS, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function normalizePhone(value: string): string {
  return value.replace(/[\s()-]/g, "");
}
