import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/events";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    // Ensure a profile row exists for the signed-in user.
    if (!error && data.user) {
      const u = data.user;
      await supabase.from("users").upsert(
        {
          id: u.id,
          email: u.email!,
          display_name:
            u.user_metadata?.full_name ?? u.email!.split("@")[0],
          avatar_url: u.user_metadata?.avatar_url ?? null,
          phone: null,
          bio: null,
          skill_level: null,
        },
        { onConflict: "id", ignoreDuplicates: true },
      );
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
