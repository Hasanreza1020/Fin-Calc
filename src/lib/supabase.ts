import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Supabase URL + publishable key are safe to ship in client code — the
// "secret" credential is the service_role key, which is never used here.
// Row-Level Security on the database is the actual access boundary.
// Env vars override these defaults if set at build time.
const DEFAULT_URL = "https://mpwxznlvfwotqgasnftg.supabase.co";
const DEFAULT_KEY = "sb_publishable_pnGOX0WWnLrrvfK73TUsWQ_QCBesVK9";

const url = import.meta.env.VITE_SUPABASE_URL || DEFAULT_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_KEY;

export const hasSupabaseEnv = Boolean(url && anonKey);

export const supabase: SupabaseClient = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
