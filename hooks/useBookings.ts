import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Booking, BookingApprovalStatus, SkillLevel } from "@/types";

export function useEventBookings(eventId: string, includePending = false) {
  return useQuery({
    queryKey: ["bookings", eventId, includePending],
    queryFn: () => {
      const params = new URLSearchParams({ event_id: eventId });
      if (includePending) params.set("includePending", "1");
      return apiFetch<Booking[]>(`/api/bookings?${params.toString()}`);
    },
    enabled: !!eventId,
  });
}

export function useMyBookings(userId: string | undefined) {
  return useQuery({
    queryKey: ["my-bookings", userId],
    queryFn: () => apiFetch<Booking[]>("/api/bookings?mine=1"),
    enabled: !!userId,
  });
}

export function useBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      skillLevel,
    }: {
      eventId: string;
      memberId: string;
      skillLevel: SkillLevel;
    }) =>
      apiFetch<{ ok: true }>("/api/bookings", {
        method: "POST",
        body: JSON.stringify({ eventId, skillLevel }),
      }),
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
    mutationFn: ({
      bookingId,
      eventId,
      skillLevel,
      approvalStatus,
    }: {
      bookingId: string;
      eventId: string;
      skillLevel: SkillLevel;
      approvalStatus?: BookingApprovalStatus;
    }) =>
      apiFetch<{ ok: true }>(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        body: JSON.stringify({
          action: "cancel",
          eventId,
          skillLevel,
          approvalStatus,
        }),
      }),
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
    mutationFn: ({
      bookingId,
      eventId,
      skillLevel,
    }: {
      bookingId: string;
      eventId: string;
      skillLevel: SkillLevel;
    }) =>
      apiFetch<{ ok: true }>(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "approve", eventId, skillLevel }),
      }),
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
    mutationFn: ({
      bookingId,
      eventId,
      skillLevel,
      approvalStatus,
    }: {
      bookingId: string;
      eventId: string;
      skillLevel: SkillLevel;
      approvalStatus: BookingApprovalStatus;
    }) =>
      apiFetch<{ ok: true }>(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        body: JSON.stringify({
          action: "reject",
          eventId,
          skillLevel,
          approvalStatus,
        }),
      }),
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
    mutationFn: ({
      bookingId,
      isPaid,
    }: {
      bookingId: string;
      isPaid: boolean;
    }) =>
      apiFetch<{ ok: true }>(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "toggle-paid", isPaid }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
    },
  });
}
