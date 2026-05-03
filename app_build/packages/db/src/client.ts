import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types.js";
import { env } from "./env.js";

// ==========================================
// Supabase Client
// Use the anon key for client-side / Edge runtime.
// For server-side operations requiring elevated privileges,
// pass the SERVICE_ROLE_KEY instead.
// ==========================================

let _client: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Returns a singleton Supabase client.
 * Safe to call in Next.js Server Components, API Routes, and Edge Runtime.
 */
export function getSupabaseClient() {
  if (!_client) {
    _client = createClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }
  return _client;
}

/**
 * Creates a fresh Supabase client for use in server-only contexts
 * where you need a service-role key (bypasses RLS).
 * Never expose this client to the browser.
 */
export function createServerSupabaseClient(serviceRoleKey: string) {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey,
    { auth: { persistSession: false } },
  );
}
