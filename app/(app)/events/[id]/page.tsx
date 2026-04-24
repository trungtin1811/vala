"use client";

import dynamic from "next/dynamic";
import DOMPurify from "dompurify";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Clock,
  Users,
  Phone,
  ChevronLeft,
  Settings,
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
import type { SkillLevel } from "@/types";

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

  const isHost = user?.id === event?.host_id;
  const myBooking = myBookings?.find((b) => b.event_id === id);
  const hasBooked = !!myBooking;
  const isApproved = myBooking?.approval_status === 'approved';
  const isPendingApproval = myBooking?.approval_status === 'pending';

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

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/events"
        className="inline-flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#0052CC] mb-6 transition-colors"
      >
        <ChevronLeft size={16} /> Tất cả vãng lai
      </Link>

      <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#0052CC] to-[#0066FF] p-6 text-white">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold mb-2">{event.title}</h1>
              <EventStatusBadge status={event.status} />
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

        <div className="p-6 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  {event.event_end_date &&
                    event.event_end_date !== event.event_date && (
                      <span className="ml-1 text-amber-600 text-xs">
                        (kết thúc {formatDate(event.event_end_date)})
                      </span>
                    )}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E8F3FF] flex items-center justify-center shrink-0">
                <MapPin size={16} className="text-[#0052CC]" />
              </div>
              <div>
                <p className="text-xs text-[#6B7280] mb-0.5">Địa điểm</p>
                <p className="text-sm font-medium text-[#1F2937]">
                  {event.location}
                </p>
              </div>
            </div>
          </div>

          {event.description && (
            <div>
              <h2 className="text-sm font-semibold text-[#1F2937] mb-2">
                Mô tả
              </h2>
              <div
                className="prose prose-sm max-w-none text-[#6B7280] prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-headings:my-2"
                dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
              />
            </div>
          )}

          <CourtLocationWidget
            location={event.location}
            courtAddress={event.court_address}
            latitude={event.latitude}
            longitude={event.longitude}
          />

          <div>
            <h2 className="text-sm font-semibold text-[#1F2937] mb-3 flex items-center gap-2">
              <Users size={14} /> Tuyển Thành Viên
            </h2>
            <div className="p-3 bg-[#F9FAFB] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#1F2937]">
                  Slot còn lại
                </span>
                <span className="text-sm font-medium text-[#1F2937]">
                  {event.booked_slots}/{event.total_slots}
                </span>
              </div>
              <div className="w-full h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0052CC] rounded-full transition-all"
                  style={{
                    width: `${event.total_slots > 0 ? (event.booked_slots / event.total_slots) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {event.skill_requirements?.map((req) => (
                  <SkillLevelBadge key={req.id} level={req.skill_level} />
                ))}
              </div>
            </div>
          </div>

          {event.host && (
            <div className="flex items-center gap-3 pt-4 border-t border-[#F3F4F6]">
              <Link href={`/profile/${event.host.id}`}>
                {event.host.avatar_url ? (
                  <img
                    src={event.host.avatar_url}
                    alt={event.host.display_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#E8F3FF] flex items-center justify-center text-[#0052CC] font-semibold">
                    {event.host.display_name[0]?.toUpperCase()}
                  </div>
                )}
              </Link>
              <div>
                <p className="text-xs text-[#6B7280]">Người tổ chức</p>
                <Link
                  href={`/profile/${event.host.id}`}
                  className="text-sm font-medium text-[#1F2937] hover:text-[#0052CC]"
                >
                  {event.host.display_name}
                </Link>
              </div>
            </div>
          )}

          {bookedHostPhone && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
              <Phone size={16} className="text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-700">
                  Đặt chỗ thành công!
                </p>
                <p className="text-sm text-emerald-600">
                  Liên hệ host: <strong>{bookedHostPhone}</strong>
                </p>
              </div>
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
                onClick={() =>
                  user ? setBookingModal(true) : router.push("/")
                }
              >
                {user ? "Tham Gia Vãng Lai" : "Đăng nhập để tham gia"}
              </Button>
            )}

          {hasBooked && (
            <div className="bg-[#E8F3FF] border border-[#0052CC]/20 rounded-xl p-4 text-center">
              <p className="text-sm font-semibold text-[#0052CC]">
                {isPendingApproval ? '⌛ Yêu cầu tham gia đang chờ host duyệt' : '✓ Bạn đã được duyệt tham gia vãng lai này'}
              </p>
              {isApproved && event.host?.phone && (
                <p className="text-sm text-[#0052CC] mt-1">
                  Liên hệ host: <strong>{event.host.phone}</strong>
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {bookings && bookings.length > 0 && (isHost || hasBooked) && (
        <div className="mt-6 bg-white border border-[#E5E7EB] rounded-2xl p-6">
          <h2 className="text-base font-semibold text-[#1F2937] mb-4">
            Danh Sách Thành Viên ({bookings.length})
          </h2>
          <div className="flex flex-col gap-3">
            {bookings.map((booking) => (
              <div key={booking.id} className="flex items-center gap-3">
                {booking.member?.avatar_url ? (
                  <img
                    src={booking.member.avatar_url}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#E8F3FF] flex items-center justify-center text-[#0052CC] text-sm font-semibold">
                    {booking.member?.display_name[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#1F2937]">
                    {booking.member?.display_name}
                  </p>
                  {isHost && booking.member?.phone && (
                    <p className="text-xs text-[#6B7280]">
                      {booking.member.phone}
                    </p>
                  )}
                </div>
                <SkillLevelBadge level={booking.skill_level} />
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        open={bookingModal}
        onClose={() => setBookingModal(false)}
        title="Chọn Trình Độ Tham Gia"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[#6B7280]">
            Chọn trình độ của bạn để tham gia vãng lai này:
          </p>
          <div className="flex flex-col gap-2">
            {availableRequirements.map((req) => (
              <button
                key={req.id}
                onClick={() => setSelectedLevel(req.skill_level)}
                className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                  selectedLevel === req.skill_level
                    ? "border-[#0052CC] bg-[#E8F3FF]"
                    : "border-[#E5E7EB] hover:border-[#0052CC]/40"
                }`}
              >
                <SkillLevelBadge level={req.skill_level} />
              </button>
            ))}
          </div>
          <p className="text-sm text-[#6B7280] text-center">
            Còn {availableSlots} chỗ
          </p>
          <Button
            className="w-full"
            onClick={handleBook}
            loading={bookMutation.isPending}
            disabled={!selectedLevel}
          >
            Xác Nhận Tham Gia
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
