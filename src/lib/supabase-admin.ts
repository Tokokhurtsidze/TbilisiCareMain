import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | undefined;

// Server-only: uses the service-role key, which bypasses Storage RLS.
// Never import this in client components.
export function supabaseAdmin(): SupabaseClient {
  if (!_client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set");
    _client = createClient(url, key, { auth: { persistSession: false } });
  }
  return _client;
}

export const PROOF_BUCKET = "rank";
