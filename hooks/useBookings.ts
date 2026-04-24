import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Booking, SkillLevel } from "@/types";

export function useEventBookings(eventId: string, includePending = false) {
  return useQuery({
    queryKey: ["bookings", eventId, includePending],
    queryFn: async () => {
      let query = supabase
        .from("bookings")
        .select("*, member:users(*)")
        .eq("event_id", eventId)
        .eq("status", "booked")
        .order("booked_at", { ascending: true });

      if (!includePending) {
        query = query.eq("approval_status", "approved");
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Booking[];
    },
    enabled: !!eventId,
  });
}

export function useMyBookings(userId: string | undefined) {
  return useQuery({
    queryKey: ["my-bookings", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          "*, event:events(*, host:users(*), skill_requirements:event_skill_requirements(*))",
        )
        .eq("member_id", userId!)
        .eq("status", "booked")
        .order("booked_at", { ascending: false });
      if (error) throw error;
      return data as Booking[];
    },
    enabled: !!userId,
  });
}

export function useBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      eventId,
      memberId,
      skillLevel,
    }: {
      eventId: string;
      memberId: string;
      skillLevel: SkillLevel;
    }) => {
      const { error: bookingError } = await supabase.from("bookings").insert({
        event_id: eventId,
        member_id: memberId,
        skill_level: skillLevel,
        status: "booked",
        approval_status: "pending",
        is_paid: false,
      });
      if (bookingError) throw bookingError;
    },
    onSuccess: (_, { eventId }) => {
      qc.invalidateQueries({ queryKey: ["event", eventId] });
      qc.invalidateQueries({ queryKey: ["bookings", eventId] });
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bookingId,
      eventId,
      skillLevel,
      approvalStatus,
    }: {
      bookingId: string;
      eventId: string;
      skillLevel: SkillLevel;
      approvalStatus?: "pending" | "approved" | "rejected";
    }) => {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);
      if (error) throw error;

      if (approvalStatus === "approved") {
        await supabase.rpc("decrement_slots_booked", {
          p_event_id: eventId,
          p_skill_level: skillLevel,
        });
      }
    },
    onSuccess: (_, { eventId }) => {
      qc.invalidateQueries({ queryKey: ["event", eventId] });
      qc.invalidateQueries({ queryKey: ["bookings", eventId] });
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
    },
  });
}

export function useApproveBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bookingId,
      eventId,
      skillLevel,
    }: {
      bookingId: string;
      eventId: string;
      skillLevel: SkillLevel;
    }) => {
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("booked_slots,total_slots")
        .eq("id", eventId)
        .single();
      if (eventError) throw eventError;
      if (eventData.booked_slots >= eventData.total_slots) {
        throw new Error("Sự kiện đã đủ chỗ, không thể duyệt thêm thành viên");
      }

      const { data, error } = await supabase
        .from("bookings")
        .select("approval_status")
        .eq("id", bookingId)
        .single();
      if (error) throw error;
      if (data.approval_status === "approved") return;

      const { error: updateError } = await supabase
        .from("bookings")
        .update({ approval_status: "approved" })
        .eq("id", bookingId);
      if (updateError) throw updateError;

      const { error: slotError } = await supabase.rpc(
        "increment_slots_booked",
        {
          p_event_id: eventId,
          p_skill_level: skillLevel,
        },
      );
      if (slotError) throw slotError;
    },
    onSuccess: (_, { eventId }) => {
      qc.invalidateQueries({ queryKey: ["event", eventId] });
      qc.invalidateQueries({ queryKey: ["bookings", eventId] });
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
    },
  });
}

export function useRejectBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bookingId,
      eventId,
      skillLevel,
      approvalStatus,
    }: {
      bookingId: string;
      eventId: string;
      skillLevel: SkillLevel;
      approvalStatus: "pending" | "approved" | "rejected";
    }) => {
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

      if (approvalStatus === "approved") {
        await supabase.rpc("decrement_slots_booked", {
          p_event_id: eventId,
          p_skill_level: skillLevel,
        });
      }
    },
    onSuccess: (_, { eventId }) => {
      qc.invalidateQueries({ queryKey: ["event", eventId] });
      qc.invalidateQueries({ queryKey: ["bookings", eventId] });
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useToggleBookingPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bookingId,
      isPaid,
    }: {
      bookingId: string;
      isPaid: boolean;
    }) => {
      const payload = isPaid
        ? { is_paid: false, paid_at: null }
        : { is_paid: true, paid_at: new Date().toISOString() };

      const { error } = await supabase
        .from("bookings")
        .update(payload)
        .eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
    },
  });
}
