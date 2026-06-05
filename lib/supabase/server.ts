import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

/**
 * Server-side Supabase client for use inside Route Handlers and Server
 * Components. Reads the user session from cookies so RLS (`auth.uid()`) applies
 * exactly as it did when the browser talked to Supabase directly.
 *
 * Always create a new client per request — never share across requests.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component where cookies are read-only.
            // The proxy refreshes the session, so this can be safely ignored.
          }
        },
      },
    },
  );
}

/**
 * Returns the authenticated user from the request cookies, or null.
 * Use this in Route Handlers to authorize mutations instead of trusting
 * client-supplied user ids.
 */
export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
