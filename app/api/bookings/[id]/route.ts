import { NextResponse } from "next/server";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { apiError, handleError } from "@/lib/supabase/route";
import type { BookingApprovalStatus, SkillLevel } from "@/types";

interface PatchBody {
  action: "cancel" | "approve" | "reject" | "toggle-paid";
  eventId?: string;
  skillLevel?: SkillLevel;
  approvalStatus?: BookingApprovalStatus;
  isPaid?: boolean;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser();
  if (!user) return apiError("Chưa đăng nhập", 401);

  const { id: bookingId } = await params;
  const supabase = await createClient();
  const body = (await request.json()) as PatchBody;

  try {
    switch (body.action) {
      case "cancel": {
        const { error } = await supabase
          .from("bookings")
          .update({ status: "cancelled" })
          .eq("id", bookingId);
        if (error) throw error;

        if (body.approvalStatus === "approved" && body.eventId) {
          await supabase.rpc("decrement_slots_booked", {
            p_event_id: body.eventId,
            p_skill_level: body.skillLevel!,
          });
        }
        break;
      }

      case "approve": {
        if (!body.eventId) return apiError("Thiếu eventId");

        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("booked_slots,total_slots")
          .eq("id", body.eventId)
          .single();
        if (eventError) throw eventError;
        if (eventData.booked_slots >= eventData.total_slots) {
          return apiError(
            "Sự kiện đã đủ chỗ, không thể duyệt thêm thành viên",
          );
        }

        const { data, error } = await supabase
          .from("bookings")
          .select("approval_status")
          .eq("id", bookingId)
          .single();
        if (error) throw error;
        if (data.approval_status === "approved") {
          return NextResponse.json({ ok: true });
        }

        const { error: updateError } = await supabase
          .from("bookings")
          .update({ approval_status: "approved" })
          .eq("id", bookingId);
        if (updateError) throw updateError;

        const { error: slotError } = await supabase.rpc(
          "increment_slots_booked",
          {
            p_event_id: body.eventId,
            p_skill_level: body.skillLevel!,
          },
        );
        if (slotError) throw slotError;
        break;
      }

      case "reject": {
        const { error: updateError } = await supabase
          .from("bookings")
          .update({
            approval_status: "rejected",
            status: "cancelled",
            is_paid: false,
            paid_at: null,
          })
          .eq("id", bookingId);
        if (updateError) throw updateError;

        if (body.approvalStatus === "approved" && body.eventId) {
          await supabase.rpc("decrement_slots_booked", {
            p_event_id: body.eventId,
            p_skill_level: body.skillLevel!,
          });
        }
        break;
      }

      case "toggle-paid": {
        const payload = body.isPaid
          ? { is_paid: false, paid_at: null }
          : { is_paid: true, paid_at: new Date().toISOString() };
        const { error } = await supabase
          .from("bookings")
          .update(payload)
          .eq("id", bookingId);
        if (error) throw error;
        break;
      }

      default:
        return apiError("Hành động không hợp lệ");
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
