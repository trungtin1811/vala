"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Shuffle,
  Pencil,
  Phone,
  Users,
  Wallet,
} from "lucide-react";
import { useEvent } from "@/hooks/useEvents";
import {
  useEventBookings,
  useCancelBooking,
  useApproveBooking,
  useRejectBooking,
  useToggleBookingPaid,
} from "@/hooks/useBookings";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SkillLevelBadge } from "@/components/shared/SkillLevelBadge";
import { EventStatusBadge } from "@/components/shared/EventStatusBadge";
import { BookingActionsMenu } from "@/components/shared/BookingActionsMenu";
import { apiFetch } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import type { Booking, EventStatus } from "@/types";
import { getErrorMessage, useToast } from "@/context/ToastContext";

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateTeams(bookings: Booking[], numCourts: number) {
  const shuffled = shuffleArray(
    bookings.filter((b) => b.approval_status === "approved"),
  );
  const teams: Booking[][] = Array.from({ length: numCourts }, () => []);
  shuffled.forEach((b, i) => teams[i % numCourts].push(b));
  return teams;
}

const teamColors = [
  "bg-blue-50 border-blue-200",
  "bg-emerald-50 border-emerald-200",
  "bg-amber-50 border-amber-200",
  "bg-purple-50 border-purple-200",
  "bg-red-50 border-red-200",
];

export function EventManagePanel({ eventId }: { eventId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  const { data: event, isLoading } = useEvent(eventId);
  const { data: bookings } = useEventBookings(eventId, true);
  const cancelBooking = useCancelBooking();
  const approveBooking = useApproveBooking();
  const rejectBooking = useRejectBooking();
  const togglePaid = useToggleBookingPaid();

  const [teamsModal, setTeamsModal] = useState(false);
  const [numCourts, setNumCourts] = useState(2);
  const [teams, setTeams] = useState<Booking[][]>([]);
  const [statusLoading, setStatusLoading] = useState(false);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-[#E5E7EB] rounded-xl w-2/3" />
        <div className="h-40 bg-[#E5E7EB] rounded-2xl" />
      </div>
    );
  }
  if (!event || event.host_id !== user?.id) {
    return (
      <div className="py-12 text-center text-[#6B7280]">
        Không có quyền truy cập.
      </div>
    );
  }

  async function updateStatus(status: EventStatus) {
    setStatusLoading(true);
    try {
      await apiFetch(`/api/events/${eventId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      qc.invalidateQueries({ queryKey: ["event", eventId] });
      qc.invalidateQueries({ queryKey: ["events"] });
      toast.success("Cập nhật trạng thái vãng lai thành công.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể cập nhật trạng thái."));
    } finally {
      setStatusLoading(false);
    }
  }

  function handleGenerateTeams() {
    if (!bookings) return;
    setTeams(generateTeams(bookings, numCourts));
  }

  const approvedBookings =
    bookings?.filter((b) => b.approval_status === "approved") ?? [];
  const pendingBookings =
    bookings?.filter((b) => b.approval_status === "pending") ?? [];
  const paidBookings = approvedBookings.filter((booking) => booking.is_paid);
  const slotPercent =
    event.total_slots > 0 ? (event.booked_slots / event.total_slots) * 100 : 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-3 gap-3">
        <SummaryStat
          icon={<Users size={16} />}
          label="Đã duyệt"
          value={`${approvedBookings.length}/${event.total_slots}`}
        />
        <SummaryStat
          icon={<Wallet size={16} />}
          label="Đã thu tiền"
          value={`${paidBookings.length}/${approvedBookings.length || 0}`}
        />
        <SummaryStat
          icon={<CalendarDays size={16} />}
          label="Chờ duyệt"
          value={pendingBookings.length}
        />
      </div>

      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[#6B7280]">
                Trạng thái
              </span>
              <EventStatusBadge status={event.status} />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-2 w-36 overflow-hidden rounded-full bg-[#E5E7EB]">
                <div
                  className="h-full rounded-full bg-[#0052CC]"
                  style={{ width: `${slotPercent}%` }}
                />
              </div>
              <span className="text-xs font-medium text-[#6B7280]">
                Slot {event.booked_slots}/{event.total_slots}
              </span>
            </div>
          </div>
          <Link href={`/events/${eventId}/edit`}>
            <Button variant="secondary" size="sm" className="w-full sm:w-auto">
              <Pencil size={14} /> Chỉnh sửa
            </Button>
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {event.status === "active" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => updateStatus("closed")}
              loading={statusLoading}
            >
              Đóng Tuyển
            </Button>
          )}
          {event.status === "closed" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => updateStatus("active")}
              loading={statusLoading}
            >
              Mở Lại
            </Button>
          )}
          {(event.status === "active" || event.status === "closed") && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => updateStatus("completed")}
              loading={statusLoading}
            >
              Hoàn Thành
            </Button>
          )}
          <Button
            variant="danger"
            size="sm"
            onClick={() => updateStatus("cancelled")}
            loading={statusLoading}
          >
            Huỷ
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 p-4 border-b border-[#F3F4F6]">
          <div>
            <h2 className="font-semibold text-[#1F2937] text-base">
              Thành viên đăng ký
            </h2>
            <p className="mt-0.5 text-xs text-[#9CA3AF]">
              {approvedBookings.length} đã duyệt · {pendingBookings.length} chờ
              duyệt
            </p>
          </div>
          {approvedBookings.length >= 2 && (
            <Button
              size="sm"
              onClick={() => {
                handleGenerateTeams();
                setTeamsModal(true);
              }}
            >
              <Shuffle size={14} /> Chia Sân
            </Button>
          )}
        </div>

        {(approveBooking.isError ||
          rejectBooking.isError ||
          togglePaid.isError) && (
          <div className="px-4 py-2 text-xs text-[#EF4444] bg-red-50 border-b border-red-100">
            {(approveBooking.error as Error | null)?.message ||
              (rejectBooking.error as Error | null)?.message ||
              (togglePaid.error as Error | null)?.message ||
              "Có lỗi xảy ra khi cập nhật trạng thái thành viên."}
          </div>
        )}

        {!bookings || bookings.length === 0 ? (
          <div className="py-12 text-center text-[#9CA3AF] text-sm">
            Chưa có thành viên nào đăng ký
          </div>
        ) : (
          <div className="divide-y divide-[#EEF2F7]">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center gap-3 bg-[#FCFDFF] px-4 py-3 transition-colors hover:bg-[#F8FAFC]"
              >
                {booking.member?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={booking.member.avatar_url}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F3FF] text-sm font-semibold text-[#0052CC]">
                    {booking.member?.display_name[0]?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#1F2937]">
                    {booking.member?.display_name}
                  </p>
                  {booking.member?.phone && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-[#6B7280]">
                      <Phone size={11} />
                      {booking.member.phone}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <SkillLevelBadge
                      level={booking.skill_level}
                      className="px-2 py-0.5 text-[11px]"
                    />
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        booking.approval_status === "approved"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {booking.approval_status === "approved"
                        ? "Đã duyệt"
                        : "Chờ duyệt"}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        booking.is_paid
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {booking.is_paid ? "Đã đóng tiền" : "Chưa đóng tiền"}
                    </span>
                  </div>
                </div>
                <BookingActionsMenu
                  booking={booking}
                  disabled={
                    approveBooking.isPending ||
                    rejectBooking.isPending ||
                    togglePaid.isPending ||
                    cancelBooking.isPending
                  }
                  onApprove={() =>
                    approveBooking.mutateAsync({
                      bookingId: booking.id,
                      eventId,
                      skillLevel: booking.skill_level,
                    })
                  }
                  onReject={() =>
                    rejectBooking.mutateAsync({
                      bookingId: booking.id,
                      eventId,
                      skillLevel: booking.skill_level,
                      approvalStatus: booking.approval_status,
                    })
                  }
                  onTogglePaid={() =>
                    togglePaid.mutateAsync({
                      bookingId: booking.id,
                      isPaid: booking.is_paid,
                    })
                  }
                  onRemove={() =>
                    cancelBooking.mutateAsync({
                      bookingId: booking.id,
                      eventId,
                      skillLevel: booking.skill_level,
                      approvalStatus: booking.approval_status,
                    })
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={teamsModal}
        onClose={() => setTeamsModal(false)}
        title="Chia Sân Ngẫu Nhiên"
        className="max-w-2xl"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <label
              htmlFor="num-courts"
              className="text-sm font-medium text-[#1F2937]"
            >
              Số sân:
            </label>
            <input
              id="num-courts"
              type="number"
              min={2}
              max={10}
              value={numCourts}
              onChange={(e) => setNumCourts(Number(e.target.value))}
              className="w-16 border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm text-center focus:outline-none focus:border-[#0052CC]"
            />
            <Button size="sm" variant="secondary" onClick={handleGenerateTeams}>
              <Shuffle size={14} /> Random lại
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {teams.map((team, i) => (
              <div
                key={`team-${i + 1}-${team.map((m) => m.id).join("-")}`}
                className={`rounded-xl border p-3 ${teamColors[i % teamColors.length]}`}
              >
                <p className="text-xs font-bold uppercase tracking-wide mb-2 text-[#1F2937]">
                  Sân {i + 1}
                </p>
                <div className="flex flex-col gap-2">
                  {team.map((b) => (
                    <div key={b.id} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[#0052CC] text-xs font-semibold">
                        {b.member?.display_name[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm text-[#1F2937] flex-1">
                        {b.member?.display_name}
                      </span>
                      <SkillLevelBadge
                        level={b.skill_level}
                        className="text-[10px] px-1.5 py-0.5"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SummaryStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-sm">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-[#E8F3FF] text-[#0052CC]">
        {icon}
      </div>
      <p className="text-xs font-medium text-[#6B7280]">{label}</p>
      <p className="mt-0.5 text-xl font-bold text-[#1F2937]">{value}</p>
    </div>
  );
}
