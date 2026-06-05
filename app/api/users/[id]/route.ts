import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleError } from "@/lib/supabase/route";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return handleError(error, 404);
  return NextResponse.json(data);
}
