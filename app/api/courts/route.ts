import { NextResponse } from "next/server";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { apiError, handleError } from "@/lib/supabase/route";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return apiError("Chưa đăng nhập", 401);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courts")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });
  if (error) return handleError(error);
  return NextResponse.json(data);
}

interface CreateCourtBody {
  name: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return apiError("Chưa đăng nhập", 401);

  const supabase = await createClient();
  const values = (await request.json()) as CreateCourtBody;

  const { data, error } = await supabase
    .from("courts")
    .insert({ owner_id: user.id, ...values })
    .select()
    .single();
  if (error) return handleError(error);
  return NextResponse.json(data);
}
