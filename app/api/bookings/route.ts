import { NextResponse } from "next/server";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { apiError, handleError } from "@/lib/supabase/route";
import type { SkillLevel } from "@/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const supabase = await createClient();

  // My bookings (member = current user).
  if (searchParams.get("mine") === "1") {
    const user = await getAuthUser();
    if (!user) return apiError("Chưa đăng nhập", 401);

    const { data, error } = await supabase
      .from("bookings")
      .select(
        "*, event:events(*, host:users(*), skill_requirements:event_skill_requirements(*))",
      )
      .eq("member_id", user.id)
      .eq("status", "booked")
      .order("booked_at", { ascending: false });
    if (error) return handleError(error);
    return NextResponse.json(data);
  }

  // Bookings for a given event.
  const eventId = searchParams.get("event_id");
  if (!eventId) return apiError("Thiếu event_id");
  const user = await getAuthUser();
  if (!user) return apiError("Chưa đăng nhập", 401);

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("host_id")
    .eq("id", eventId)
    .single();
  if (eventError) return handleError(eventError);
  if (event.host_id !== user.id) {
    return apiError("Chỉ chủ bài đăng mới xem được danh sách thành viên", 403);
  }

  const includePending = searchParams.get("includePending") === "1";

  let query = supabase
    .from("bookings")
    .select("*, member:users(*)")
    .eq("event_id", eventId)
    .eq("status", "booked")
    .order("booked_at", { ascending: true });

  if (!includePending) query = query.eq("approval_status", "approved");

  const { data, error } = await query;
  if (error) return handleError(error);
  return NextResponse.json(data);
}

interface BookBody {
  eventId: string;
  skillLevel: SkillLevel;
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return apiError("Chưa đăng nhập", 401);

  const supabase = await createClient();
  const { eventId, skillLevel } = (await request.json()) as BookBody;

  const { error } = await supabase.from("bookings").insert({
    event_id: eventId,
    member_id: user.id,
    skill_level: skillLevel,
    status: "booked",
    approval_status: "pending",
    is_paid: false,
  });
  if (error) return handleError(error);
  return NextResponse.json({ ok: true });
}
