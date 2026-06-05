import { NextResponse } from "next/server";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { apiError, handleError } from "@/lib/supabase/route";
import type { SkillLevel } from "@/types";

/** Returns the current user's profile row, or null when signed out. */
export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json(null);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();
  if (error) return handleError(error);
  return NextResponse.json(data);
}

interface UpdateProfileBody {
  display_name: string;
  phone?: string | null;
  bio?: string | null;
  skill_level?: SkillLevel | null;
}

export async function PATCH(request: Request) {
  const user = await getAuthUser();
  if (!user) return apiError("Chưa đăng nhập", 401);

  const supabase = await createClient();
  const body = (await request.json()) as UpdateProfileBody;

  const { error } = await supabase
    .from("users")
    .update({
      display_name: body.display_name,
      phone: body.phone || null,
      bio: body.bio || null,
      skill_level: (body.skill_level as SkillLevel) || null,
    })
    .eq("id", user.id);
  if (error) return handleError(error);
  return NextResponse.json({ ok: true });
}
