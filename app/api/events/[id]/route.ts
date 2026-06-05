import { NextResponse } from "next/server";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { apiError, handleError } from "@/lib/supabase/route";
import { computeEndDate } from "@/lib/eventTime";
import type { EventStatus, SkillLevel } from "@/types";

const FULL_SELECT =
  "*, host:users(*), skill_requirements:event_skill_requirements(*)";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .select(FULL_SELECT)
    .eq("id", id)
    .single();

  if (error) return handleError(error, 404);
  return NextResponse.json(data);
}

interface EditEventBody {
  title: string;
  description?: string | null;
  location: string;
  court_id: string | null;
  court_address?: string | null;
  latitude: number | null;
  longitude: number | null;
  event_date: string;
  event_time: string;
  event_end_time?: string | null;
  total_slots: number;
  price_enabled: boolean;
  price_min?: number | null;
  price_max?: number | null;
  split_evenly: boolean;
  skill_levels: SkillLevel[];
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser();
  if (!user) return apiError("Chưa đăng nhập", 401);

  const { id } = await params;
  const supabase = await createClient();
  const body = await request.json();

  try {
    // Status-only update (manage page).
    if (!("skill_levels" in body)) {
      const status = body.status as EventStatus | undefined;
      if (!status) return apiError("Thiếu trạng thái cần cập nhật");

      const { error } = await supabase
        .from("events")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    // Full edit.
    const values = body as EditEventBody;

    const { error: eventError } = await supabase
      .from("events")
      .update({
        title: values.title,
        description: values.description || null,
        location: values.location,
        court_id: values.court_id,
        court_address: values.court_address || null,
        latitude: values.latitude,
        longitude: values.longitude,
        event_date: values.event_date,
        event_time: values.event_time,
        event_end_time: values.event_end_time || null,
        event_end_date: computeEndDate(
          values.event_date,
          values.event_time,
          values.event_end_time ?? "",
        ),
        total_slots: values.total_slots,
        price_min: values.price_enabled ? (values.price_min ?? null) : null,
        price_max: values.price_enabled ? (values.price_max ?? null) : null,
        split_evenly: values.price_enabled ? values.split_evenly : false,
      })
      .eq("id", id);
    if (eventError) throw eventError;

    const { error: deleteError } = await supabase
      .from("event_skill_requirements")
      .delete()
      .eq("event_id", id);
    if (deleteError) throw deleteError;

    const requirements = values.skill_levels.map((level) => ({
      event_id: id,
      skill_level: level,
    }));
    const { error: reqError } = await supabase
      .from("event_skill_requirements")
      .insert(requirements);
    if (reqError) throw reqError;

    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser();
  if (!user) return apiError("Chưa đăng nhập", 401);

  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return handleError(error);
  return new NextResponse(null, { status: 204 });
}
