"use client";

import dynamic from "next/dynamic";
import DOMPurify from "dompurify";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  Phone,
  ChevronLeft,
  Settings,
  MoreVertical,
  CalendarDays,
  User,
} from "lucide-react";
import { useEvent } from "@/hooks/useEvents";
import { useEventBookings, useBook, useMyBookings } from "@/hooks/useBookings";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SkillLevelBadge } from "@/components/shared/SkillLevelBadge";
import { EventStatusBadge } from "@/components/shared/EventStatusBadge";
import { formatDate } from "@/lib/utils";
import { formatTimeRange } from "@/lib/eventTime";
import { SKILL_LEVEL_LABELS, type SkillLevel } from "@/types";

const CourtLocationWidget = dynamic(
  () => import("@/components/Map/CourtLocationWidget"),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl border border-[#E5E7EB] p-4 bg-white animate-pulse">
        <div className="h-4 w-32 bg-[#E5E7EB] rounded mb-3" />
        <div className="h-3 w-52 bg-[#E5E7EB] rounded mb-4" />
        <div className="h-44 bg-[#E5E7EB] rounded-xl" />
      </div>
    ),
  },
);

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { data: event, isLoading } = useEvent(id);
  const { data: bookings } = useEventBookings(id);
  const { data: myBookings } = useMyBookings(user?.id);
  const bookMutation = useBook();

  const [bookingModal, setBookingModal] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel | null>(null);
  const [bookedHostPhone, setBookedHostPhone] = useState<string | null>(null);
  const [memberSkillFilter, setMemberSkillFilter] = useState<SkillLevel | "all">(
    "all",
  );

  const isHost = user?.id === event?.host_id;
  const myBooking = myBookings?.find((b) => b.event_id === id);
  const hasBooked = !!myBooking;
  const isApproved = myBooking?.approval_status === "approved";
  const isPendingApproval = myBooking?.approval_status === "pending";

  async function handleBook() {
    if (!user || !event || !selectedLevel) return;
    await bookMutation.mutateAsync({
      eventId: id,
      memberId: user.id,
      skillLevel: selectedLevel,
    });
    setBookingModal(false);
    setBookedHostPhone(event.host?.phone ?? null);
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[#E5E7EB] rounded w-3/4" />
          <div className="h-4 bg-[#E5E7EB] rounded w-1/2" />
          <div className="h-40 bg-[#E5E7EB] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-[#6B7280]">Không tìm thấy vãng lai này.</p>
        <Link
          href="/events"
          className="text-[#0052CC] font-medium mt-4 inline-block"
        >
          ← Quay lại
        </Link>
      </div>
    );
  }

  const availableRequirements = event.skill_requirements ?? [];
  const availableSlots = event.total_slots - event.booked_slots;
  const sanitizedDescription = event.description
    ? DOMPurify.sanitize(event.description)
    : "";
  const visibleBookings = bookings?.filter(
    (booking) =>
      memberSkillFilter === "all" || booking.skill_level === memberSkillFilter,
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/events"
        className="inline-flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#0052CC] mb-6 transition-colors"
      >
        <ChevronLeft size={16} /> Tất cả vãng lai
      </Link>

      <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-visible">
        <div className="bg-gradient-to-r from-[#0052CC] to-[#0066FF] p-6 text-white">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">{event.title}</h1>
                <EventStatusBadge status={event.status} />
              </div>
              {event.host && (
                <div className="flex items-center gap-2 text-white/80 text-sm flex-wrap">
                  <div className="relative group">
                    <div className="inline-flex items-center gap-2">
                      <User size={14} className="text-white/70" />
                      <span>Người tổ chức:</span>
                      <Link
                        href={`/profile/${event.host.id}`}
                        className="text-white font-semibold hover:text-white/90"
                      >
                        {event.host.display_name}
                      </Link>
                    </div>
                    <div className="pointer-events-none absolute left-0 top-full z-50 w-72 pt-2 opacity-0 translate-y-1 transition-all duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-y-0">
                      <div className="rounded-xl border border-white/20 bg-white p-3 shadow-xl">
                        <div className="flex items-center gap-3">
                          {event.host.avatar_url ? (
                            <img
                              src={event.host.avatar_url}
                              alt={event.host.display_name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-[#E8F3FF] flex items-center justify-center text-[#0052CC] font-semibold">
                              {event.host.display_name[0]?.toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs text-[#6B7280]">Người tổ chức</p>
                            <p className="text-sm font-semibold text-[#1F2937] truncate">
                              {event.host.display_name}
                            </p>
                            <p className="text-sm text-[#374151]">
                              {event.host.phone ?? "Chưa cập nhật SĐT"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="text-white/50">•</span>
                  <div className="inline-flex items-center gap-2">
                    <CalendarDays size={14} className="text-white/70" />
                    <span>{formatDate(event.event_date)}</span>
                  </div>
                </div>
              )}
            </div>
            {isHost && (
              <Link href={`/events/${id}/manage`}>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 text-white border-0 hover:bg-white/30"
                >
                  <Settings size={14} /> Quản Lý
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-10 gap-6">
        <div className="lg:col-span-6 bg-white border border-[#E5E7EB] rounded-2xl p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-base font-semibold text-[#1F2937]">Quản Lý Thành Viên</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[#6B7280]">
                Slot: {event.booked_slots}/{event.total_slots}
              </span>
              <div className="w-28 h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0052CC] rounded-full transition-all"
                  style={{
                    width: `${event.total_slots > 0 ? (event.booked_slots / event.total_slots) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={() => setMemberSkillFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                memberSkillFilter === "all"
                  ? "bg-[#0052CC] text-white border-[#0052CC]"
                  : "bg-white text-[#4B5563] border-[#D1D5DB] hover:border-[#9CA3AF]"
              }`}
            >
              Tất cả
            </button>
            {availableRequirements.map((req) => (
              <button
                key={req.id}
                type="button"
                onClick={() => setMemberSkillFilter(req.skill_level)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                  memberSkillFilter === req.skill_level
                    ? "bg-[#0052CC] text-white border-[#0052CC]"
                    : "bg-white text-[#4B5563] border-[#D1D5DB] hover:border-[#9CA3AF]"
                }`}
              >
                {SKILL_LEVEL_LABELS[req.skill_level]}
              </button>
            ))}
          </div>

          {visibleBookings && visibleBookings.length > 0 && (isHost || hasBooked) ? (
            <div className="flex flex-col gap-3">
              {visibleBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-3 rounded-xl border border-[#EEF2FF] bg-[#FBFCFF] px-3 py-2.5"
                >
                  {booking.member?.avatar_url ? (
                    <img
                      src={booking.member.avatar_url}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#E8F3FF] flex items-center justify-center text-[#0052CC] text-sm font-semibold">
                      {booking.member?.display_name[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1F2937] truncate">
                      {booking.member?.display_name}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-[#6B7280]">Trình độ:</span>
                      <SkillLevelBadge level={booking.skill_level} />
                    </div>
                    <p className="text-xs text-[#94A3B8] mt-1">
                      Registered on{" "}
                      {new Date(booking.booked_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  {isHost && (
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        booking.is_paid
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {booking.is_paid ? "ĐÃ ĐÓNG TIỀN" : "CHƯA ĐÓNG TIỀN"}
                    </span>
                  )}
                  <button
                    type="button"
                    className="text-[#94A3B8] hover:text-[#64748B] transition-colors"
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#D8E2F0] bg-[#FCFDFF] px-4 py-7 text-sm text-[#94A3B8] text-center italic">
              Waiting for more members to join...
            </div>
          )}
        </div>

        <div className="lg:col-span-4 flex flex-col gap-5">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 flex flex-col gap-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E8F3FF] flex items-center justify-center shrink-0">
                <Clock size={16} className="text-[#0052CC]" />
              </div>
              <div>
                <p className="text-xs text-[#6B7280] mb-0.5">Thời gian</p>
                <p className="text-sm font-medium text-[#1F2937]">
                  {formatDate(event.event_date)}
                </p>
                <p className="text-sm text-[#6B7280]">
                  {formatTimeRange(
                    event.event_time,
                    event.event_end_time ?? null,
                    event.event_date,
                    event.event_end_date ?? null,
                  )}
                </p>
              </div>
            </div>
            
            {event.description && (
              <div>
                <h3 className="text-sm font-semibold text-[#1F2937] mb-2">Mô tả</h3>
                <div
                  className="prose prose-sm max-w-none text-[#6B7280] prose-p:my-1"
                  dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                />
              </div>
            )}
            {bookedHostPhone && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
                <Phone size={14} className="text-emerald-600 shrink-0" />
                <p className="text-sm text-emerald-700">
                  Liên hệ host: <strong>{bookedHostPhone}</strong>
                </p>
              </div>
            )}
            {!isHost &&
              !hasBooked &&
              event.status === "active" &&
              availableSlots > 0 &&
              availableRequirements.length > 0 && (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => (user ? setBookingModal(true) : router.push("/"))}
                >
                  {user ? "Tham Gia Vãng Lai" : "Đăng nhập để tham gia"}
                </Button>
              )}
            {hasBooked && (
              <div className="bg-[#E8F3FF] border border-[#0052CC]/20 rounded-xl p-4 text-center">
                <p className="text-sm font-semibold text-[#0052CC]">
                  {isPendingApproval
                    ? "⌛ Yêu cầu tham gia đang chờ host duyệt"
                    : "✓ Bạn đã được duyệt tham gia vãng lai này"}
                </p>
                {isApproved && event.host?.phone && (
                  <p className="text-sm text-[#0052CC] mt-1">
                    Liên hệ host: <strong>{event.host.phone}</strong>
                  </p>
                )}
              </div>
            )}


          </div> 
          <div className="rounded-xl overflow-hidden border border-[#E5E7EB]">
            <CourtLocationWidget
              location={event.location}
              courtAddress={event.court_address}
              latitude={event.latitude}
              longitude={event.longitude}
            />
          </div></div>
      </div>

      <Modal
        open={bookingModal}
        onClose={() => setBookingModal(false)}
        title="Chọn Trình Độ Tham Gia"
        className="max-w-xl"
      >
        <div className="flex flex-col gap-5">
          <div className="rounded-xl bg-[#F8FAFF] border border-[#E3ECFF] p-3">
            <p className="text-sm font-medium text-[#1F2937]">{event.title}</p>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Chọn trình độ phù hợp để host duyệt nhanh hơn.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {availableRequirements.map((req) => (
              <button
                key={req.id}
                type="button"
                onClick={() => setSelectedLevel(req.skill_level)}
                className={`rounded-xl border px-3 py-2.5 transition-all text-left ${
                  selectedLevel === req.skill_level
                    ? "border-[#0052CC] bg-[#E8F3FF] shadow-sm"
                    : "border-[#E5E7EB] bg-white hover:border-[#9CC2FF] hover:bg-[#F9FBFF]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <SkillLevelBadge level={req.skill_level} />
                  {selectedLevel === req.skill_level && (
                    <span className="text-[11px] font-semibold text-[#0052CC]">
                      Đã chọn
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2">
            <p className="text-sm text-[#6B7280]">Số chỗ còn lại</p>
            <p className="text-sm font-semibold text-[#1F2937]">
              {availableSlots} chỗ
            </p>
          </div>

          <Button
            className="w-full"
            onClick={handleBook}
            loading={bookMutation.isPending}
            disabled={!selectedLevel}
          >
            Xác Nhận Đặt Chỗ
          </Button>
          {bookMutation.isError && (
            <p className="text-xs text-[#EF4444] text-center">
              Có lỗi xảy ra, vui lòng thử lại.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
