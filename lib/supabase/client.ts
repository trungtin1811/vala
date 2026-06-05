import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

/**
 * Browser-side Supabase client. Used **only for auth** (OAuth sign-in, session,
 * sign-out). All data reads/writes go through Next.js Route Handlers under
 * `/api/*`, which talk to Supabase server-side.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
