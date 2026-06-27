/**
 * Helpers for JSON-ish columns that must work on BOTH Postgres (native Json)
 * and SQLite (plain text). We always store a JSON string and parse on read, so
 * the behaviour is identical across databases.
 */
export function toJsonField(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  return typeof value === 'string' ? value : JSON.stringify(value);
}

export function fromJsonField<T = any>(value: unknown): T | null {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }
  return value as T;
}
