import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabaseEnv = Boolean(url && anonKey);

if (!hasSupabaseEnv) {
  // eslint-disable-next-line no-console
  console.warn(
    "Supabase env not set. Copy .env.example to .env and fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  );
}

// Supabase v2 throws synchronously inside createClient() if the URL is empty,
// which would crash the whole app before React mounts. When env is missing
// we feed a syntactically-valid placeholder so the app still boots into Login;
// any real network call would fail, but auth gates the rest of the app.
const safeUrl = hasSupabaseEnv ? url : "https://placeholder.supabase.co";
const safeKey = hasSupabaseEnv ? anonKey : "placeholder-anon-key";

export const supabase: SupabaseClient = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: hasSupabaseEnv,
    autoRefreshToken: hasSupabaseEnv,
    detectSessionInUrl: hasSupabaseEnv,
  },
});
