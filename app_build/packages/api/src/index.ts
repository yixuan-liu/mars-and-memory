import { z } from "zod";

// ==========================================
// Generic type-safe fetch helper with Zod validation
// ==========================================

export async function typedFetch<T>(
  url: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  return schema.parse(json);
}

// ==========================================
// Example: typed API client factory
// Replace BASE_URL with your actual API base.
// ==========================================

let BASE_URL = "http://localhost:3000/api";

export function setBaseUrl(url: string) {
  BASE_URL = url;
}

export function getBaseUrl() {
  return BASE_URL;
}

/**
 * Creates a typed GET fetcher for a given endpoint + schema.
 *
 * Usage:
 * ```ts
 * import { z } from "zod";
 * import { createGetter } from "@mars-memory/api";
 *
 * const UserSchema = z.object({ id: z.string(), name: z.string() });
 * const getUsers = createGetter("/users", z.array(UserSchema));
 * const users = await getUsers();
 * ```
 */
export function createGetter<T>(endpoint: string, schema: z.ZodType<T>) {
  return (init?: RequestInit) => typedFetch(`${BASE_URL}${endpoint}`, schema, init);
}
