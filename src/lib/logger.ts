type Level = "debug" | "info" | "warn" | "error";
type Context = Record<string, unknown>;

/** Keys that may contain personal data; their values are never written to logs. */
const REDACTED_KEYS = new Set(["name", "email", "phone", "address", "notes", "customer", "ip"]);

function redact(context: Context): Context {
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => {
      if (REDACTED_KEYS.has(key)) return [key, "[redacted]"];
      if (value instanceof Error) return [key, { name: value.name, message: value.message }];
      return [key, value];
    }),
  );
}

function write(level: Level, message: string, context: Context = {}): void {
  if (process.env.NODE_ENV === "test" && level !== "error") return;
  const entry = JSON.stringify({ level, message, time: new Date().toISOString(), ...redact(context) });
  if (level === "error") console.error(entry);
  else if (level === "warn") console.warn(entry);
  else console.log(entry);
}

/** Structured JSON logger with PII redaction. */
export const logger = {
  debug: (message: string, context?: Context) => write("debug", message, context),
  info: (message: string, context?: Context) => write("info", message, context),
  warn: (message: string, context?: Context) => write("warn", message, context),
  error: (message: string, context?: Context) => write("error", message, context),
};
