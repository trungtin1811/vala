import { NextResponse } from "next/server";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { apiError, handleError } from "@/lib/supabase/route";
import { computeEndDate } from "@/lib/eventTime";
import { format } from "date-fns";
import type { EventStatus, SkillLevel } from "@/types";

const FULL_SELECT =
  "*, host:users(*), skill_requirements:event_skill_requirements(*)";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const supabase = await createClient();

  const hostId = searchParams.get("host_id");
  const mine = searchParams.get("mine") === "1";
  const status = searchParams.get("status");
  const activeOnly = searchParams.get("activeOnly") === "1";
  const location = searchParams.get("location");
  const date = searchParams.get("date");
  const order = searchParams.get("order") === "desc" ? "desc" : "asc";
  const limit = searchParams.get("limit");

  let resolvedHostId = hostId;
  if (mine) {
    const user = await getAuthUser();
    if (!user) return apiError("Chưa đăng nhập", 401);
    resolvedHostId = user.id;
  }

  let query = supabase.from("events").select(FULL_SELECT);

  if (resolvedHostId) query = query.eq("host_id", resolvedHostId);

  if (status) query = query.eq("status", status as EventStatus);
  else if (activeOnly) query = query.in("status", ["active", "closed"]);

  if (location) query = query.ilike("location", `%${location}%`);
  if (date) query = query.eq("event_date", date);

  query = query
    .order("event_date", { ascending: order === "asc" })
    .order("event_time", { ascending: true });

  if (limit) query = query.limit(Number(limit));

  const { data, error } = await query;
  if (error) return handleError(error);
  return NextResponse.json(data);
}

interface CreateEventBody {
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
  repeat_enabled?: boolean;
  repeat_days?: number[];
  repeat_until?: string;
}

function generateRepeatDates(
  startDate: string,
  repeatDays: number[],
  untilDate: string,
): string[] {
  const dates: string[] = [];
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(untilDate + "T00:00:00");
  if (end < start || repeatDays.length === 0) return [startDate];
  const cur = new Date(start);
  while (cur <= end) {
    if (repeatDays.includes(cur.getDay())) {
      dates.push(format(cur, "yyyy-MM-dd"));
    }
    cur.setDate(cur.getDate() + 1);
  }
  return dates.length > 0 ? dates : [startDate];
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return apiError("Chưa đăng nhập", 401);

  const supabase = await createClient();
  const values = (await request.json()) as CreateEventBody;

  try {
    const dates =
      values.repeat_enabled &&
      (values.repeat_days?.length ?? 0) > 0 &&
      values.repeat_until
        ? generateRepeatDates(
            values.event_date,
            values.repeat_days!,
            values.repeat_until,
          )
        : [values.event_date];

    let firstEventId: string | null = null;

    for (const date of dates) {
      const { data: event, error: eventError } = await supabase
        .from("events")
        .insert({
          host_id: user.id,
          title: values.title,
          description: values.description || null,
          location: values.location,
          court_id: values.court_id,
          court_address: values.court_address || null,
          latitude: values.latitude,
          longitude: values.longitude,
          event_date: date,
          event_time: values.event_time,
          event_end_time: values.event_end_time || null,
          event_end_date: computeEndDate(
            date,
            values.event_time,
            values.event_end_time ?? "",
          ),
          status: "active",
          token_cost: 0,
          total_slots: values.total_slots,
          booked_slots: 0,
          price_min: values.price_enabled ? (values.price_min ?? null) : null,
          price_max: values.price_enabled ? (values.price_max ?? null) : null,
          split_evenly: values.price_enabled ? values.split_evenly : false,
        })
        .select()
        .single();

      if (eventError) throw eventError;
      if (!firstEventId) firstEventId = event.id;

      const requirements = values.skill_levels.map((level) => ({
        event_id: event.id,
        skill_level: level,
      }));

      const { error: reqError } = await supabase
        .from("event_skill_requirements")
        .insert(requirements);
      if (reqError) throw reqError;
    }

    return NextResponse.json({ firstEventId, count: dates.length });
  } catch (e) {
    return handleError(e);
  }
}
