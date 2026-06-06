"use client";

import dynamic from "next/dynamic";
import DOMPurify from "dompurify";
import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Phone,
  ChevronLeft,
  CalendarDays,
  User,
  MapPin,
  Users,
  Wallet,
  Pencil,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useEvent } from "@/hooks/useEvents";
import {
  useApproveBooking,
  useCancelBooking,
  useEventBookings,
  useBook,
  useMyBookings,
  useRejectBooking,
  useToggleBookingPaid,
} from "@/hooks/useBookings";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SkillLevelBadge } from "@/components/shared/SkillLevelBadge";
import { EventStatusBadge } from "@/components/shared/EventStatusBadge";
import { BookingActionsMenu } from "@/components/shared/BookingActionsMenu";
import { EventStatusActionsMenu } from "@/components/shared/EventStatusActionsMenu";
import { formatDate } from "@/lib/utils";
import { formatTimeRange } from "@/lib/eventTime";
import { apiFetch } from "@/lib/api";
import { type EventStatus, type SkillLevel } from "@/types";
import { getErrorMessage, useToast } from "@/context/ToastContext";

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

const DESCRIPTION_COLLAPSED_HEIGHT = 288;
const descriptionClassName =
  "text-sm text-[#6B7280] [&_h1]:my-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-[#1F2937] [&_h2]:my-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[#1F2937] [&_h3]:my-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-[#1F2937] [&_p]:my-1 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-0.5 [&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-[#CBD5E1] [&_blockquote]:pl-4 [&_blockquote]:italic [&_a]:text-[#0052CC] [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded [&_code]:bg-[#F1F5F9] [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-[#111827] [&_pre]:p-3 [&_pre]:text-[#F9FAFB] [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_hr]:my-4 [&_hr]:border-[#E5E7EB]";

function CollapsibleDescription({ html }: { html: string }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [canCollapse, setCanCollapse] = useState(false);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const measure = () => {
      setCanCollapse(content.scrollHeight > DESCRIPTION_COLLAPSED_HEIGHT + 1);
    };
    const frame = requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    observer.observe(content);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [html]);

  return (
    <div>
      <div className="relative">
        <div
          ref={contentRef}
          className={`${descriptionClassName} ${
            canCollapse && !expanded ? "max-h-72 overflow-hidden" : ""
          }`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {canCollapse && !expanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-white to-transparent" />
        )}
      </div>

      {canCollapse && (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#0052CC] hover:text-[#003D99] transition-colors"
        >
          {expanded ? (
            <>
              Thu gọn <ChevronUp size={15} />
            </>
          ) : (
            <>
              Xem thêm <ChevronDown size={15} />
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();
  const { data: event, isLoading } = useEvent(id);
  const isHost = user?.id === event?.host_id;
  const { data: bookings } = useEventBookings(id, true, isHost);
  const { data: myBookings } = useMyBookings(user?.id);
  const bookMutation = useBook();
  const cancelBooking = useCancelBooking();
  const approveBooking = useApproveBooking();
  const rejectBooking = useRejectBooking();
  const togglePaid = useToggleBookingPaid();

  const [bookingModal, setBookingModal] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel | null>(null);
  const [bookedHostPhone, setBookedHostPhone] = useState<string | null>(null);
  const [memberView, setMemberView] = useState<
    "all" | "pending" | "payment" | "approved"
  >("all");
  const [statusLoading, setStatusLoading] = useState(false);

  const myBooking = myBookings?.find((b) => b.event_id === id);
  const hasBooked = !!myBooking;
  const isApproved = myBooking?.approval_status === "approved";
  const isPendingApproval = myBooking?.approval_status === "pending";
  const isPaid = myBooking?.is_paid ?? false;

  async function handleBook() {
    if (!user || !event || !selectedLevel) return;
    try {
      await bookMutation.mutateAsync({
        eventId: id,
        memberId: user.id,
        skillLevel: selectedLevel,
      });
      setBookingModal(false);
      setBookedHostPhone(event.host?.phone ?? null);
    } catch {
      // The booking mutation reports the error through the global toast.
    }
  }

  async function updateStatus(status: EventStatus) {
    setStatusLoading(true);
    try {
      await apiFetch(`/api/events/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      qc.invalidateQueries({ queryKey: ["event", id] });
      qc.invalidateQueries({ queryKey: ["events"] });
      toast.success("Cập nhật trạng thái vãng lai thành công.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể cập nhật trạng thái."));
    } finally {
      setStatusLoading(false);
    }
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
  const approvedBookings =
    bookings?.filter((booking) => booking.approval_status === "approved") ?? [];
  const pendingBookings =
    bookings?.filter((booking) => booking.approval_status === "pending") ?? [];
  const paidBookings = approvedBookings.filter((booking) => booking.is_paid);
  const unpaidApprovedBookings = approvedBookings.filter(
    (booking) => !booking.is_paid,
  );
  const visibleBookings =
    bookings?.filter((booking) => {
      const matchesView =
        memberView === "all" ||
        (memberView === "pending" && booking.approval_status === "pending") ||
        (memberView === "approved" && booking.approval_status === "approved") ||
        (memberView === "payment" &&
          booking.approval_status === "approved" &&
          !booking.is_paid);

      return matchesView;
    }) ?? [];
  const memberTabs = [
    { value: "all", label: "Tất cả", count: bookings?.length ?? 0 },
    { value: "pending", label: "Chờ duyệt", count: pendingBookings.length },
    {
      value: "payment",
      label: "Thu tiền",
      count: unpaidApprovedBookings.length,
    },
    { value: "approved", label: "Đã duyệt", count: approvedBookings.length },
  ] as const;
  const slotPercent =
    event.total_slots > 0 ? (event.booked_slots / event.total_slots) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/events"
        className="inline-flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#0052CC] mb-6 transition-colors"
      >
        <ChevronLeft size={16} /> Tất cả vãng lai
      </Link>

      <div className="rounded-3xl border border-[#D8E2F0] bg-white shadow-sm overflow-hidden">
        <div className="bg-linear-to-r from-[#0052CC] via-[#0066FF] to-[#2A7CFF] p-6 text-white">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold tracking-normal text-white">
                  {event.title}
                </h1>
                <EventStatusBadge status={event.status} />
              </div>
              {event.host && (
                <div className="flex flex-wrap items-center gap-2 text-sm text-white/80">
                  <div className="relative group">
                    <div className="inline-flex items-center gap-2">
                      <User size={14} className="text-white/75" />
                      <span>Người tổ chức:</span>
                      <Link
                        href={`/profile/${event.host.id}`}
                        className="font-semibold text-white hover:text-white/90"
                      >
                        {event.host.display_name}
                      </Link>
                    </div>
                    <div className="pointer-events-none absolute left-0 top-full z-50 w-72 pt-2 opacity-0 translate-y-1 transition-all duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-y-0">
                      <div className="rounded-xl border border-white/20 bg-white p-3 shadow-xl">
                        <div className="flex items-center gap-3">
                          {event.host.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
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
                            <p className="text-xs text-[#6B7280]">
                              Người tổ chức
                            </p>
                            <p className="text-sm font-semibold text-[#1F2937] truncate">
                              {event.host.display_name}
                            </p>
                            <p className="text-sm text-[#374151]">
                              {isHost
                                ? (event.host.phone ?? "Chưa cập nhật SĐT")
                                : "Thông tin liên hệ hiển thị sau khi được duyệt"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="text-white/40">•</span>
                  <div className="inline-flex items-center gap-2">
                    <CalendarDays size={14} className="text-white/75" />
                    <span>{formatDate(event.event_date)}</span>
                  </div>
                  <span className="text-white/40">•</span>
                  <div className="inline-flex items-center gap-2">
                    <MapPin size={14} className="text-white/75" />
                    <span>{event.location}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {isHost && (
          <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4">
            <DetailStat
              icon={<Clock size={16} />}
              label="Thời gian"
              value={formatTimeRange(
                event.event_time,
                event.event_end_time ?? null,
                event.event_date,
                event.event_end_date ?? null,
              )}
            />
            <DetailStat
              icon={<Users size={16} />}
              label="Slot"
              value={`${event.booked_slots}/${event.total_slots}`}
            />
            <DetailStat
              icon={<Wallet size={16} />}
              label="Đã thu tiền"
              value={`${paidBookings.length}/${approvedBookings.length || 0}`}
            />
            <DetailStat
              icon={<CalendarDays size={16} />}
              label="Chờ duyệt"
              value={pendingBookings.length}
            />
          </div>
        )}
      </div>

      {isHost && (
        <div className="mt-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#1F2937]">
                Quản lý vãng lai
              </p>
              <p className="mt-0.5 text-xs text-[#9CA3AF]">
                Chỉnh sửa thông tin, đổi trạng thái và kết thúc buổi chơi.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/events/${id}/edit`}>
                <Button variant="secondary" size="sm">
                  <Pencil size={14} /> Chỉnh sửa
                </Button>
              </Link>
              <EventStatusActionsMenu
                status={event.status}
                onUpdateStatus={updateStatus}
                disabled={statusLoading}
              />
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-10 gap-6">
        {isHost && (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm lg:col-span-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-base font-semibold text-[#1F2937]">
                Thành viên
              </h2>
              <p className="mt-0.5 text-xs text-[#9CA3AF]">
                {approvedBookings.length} đã duyệt · {pendingBookings.length}{" "}
                chờ duyệt
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[#6B7280]">
                Slot: {event.booked_slots}/{event.total_slots}
              </span>
              <div className="w-28 h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0052CC] rounded-full transition-all"
                  style={{ width: `${slotPercent}%` }}
                />
              </div>
            </div>
          </div>

            <div className="mb-4 flex w-full gap-1 overflow-x-auto rounded-2xl bg-[#F8FAFC] p-1 sm:w-fit">
              {memberTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setMemberView(tab.value)}
                  className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors ${
                    memberView === tab.value
                      ? "bg-white text-[#0052CC] shadow-sm"
                      : "text-[#64748B] hover:bg-white/70 hover:text-[#1F2937]"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[11px] ${
                      memberView === tab.value
                        ? "bg-[#E8F3FF] text-[#0052CC]"
                        : "bg-white text-[#94A3B8]"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

          {visibleBookings.length > 0 ? (
            <div className="flex flex-col gap-3">
              {visibleBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-3 rounded-2xl border border-[#EEF2FF] bg-[#FBFCFF] px-4 py-3 transition-colors hover:bg-[#F8FAFC]"
                >
                  {booking.member?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
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
                    {booking.member?.phone && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-[#6B7280]">
                        <Phone size={11} />
                        {booking.member.phone}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <SkillLevelBadge level={booking.skill_level} />
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
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {booking.is_paid ? "Đã đóng tiền" : "Chưa đóng tiền"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#94A3B8]">
                      Đăng ký ngày{" "}
                      {new Date(booking.booked_at).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </p>
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
                          eventId: id,
                          skillLevel: booking.skill_level,
                        })
                      }
                      onReject={() =>
                        rejectBooking.mutateAsync({
                          bookingId: booking.id,
                          eventId: id,
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
                          eventId: id,
                          skillLevel: booking.skill_level,
                          approvalStatus: booking.approval_status,
                        })
                      }
                    />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#D8E2F0] bg-[#FCFDFF] px-4 py-7 text-sm text-[#94A3B8] text-center italic">
              Waiting for more members to join...
            </div>
          )}
          </div>
        )}

        <div
          className={
            isHost
              ? "lg:col-span-4 flex flex-col gap-5"
              : "lg:col-span-10 grid grid-cols-1 gap-5 lg:grid-cols-2"
          }
        >
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
                <h3 className="text-sm font-semibold text-[#1F2937] mb-2">
                  Mô tả
                </h3>
                <CollapsibleDescription html={sanitizedDescription} />
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
                  onClick={() =>
                    user ? setBookingModal(true) : router.push("/")
                  }
                >
                  {user ? "Tham Gia Vãng Lai" : "Đăng nhập để tham gia"}
                </Button>
              )}
            {hasBooked && (
              <div className="rounded-2xl border border-[#D8E8FF] bg-[#F4F8FF] p-4">
                <p className="text-sm font-semibold text-[#1F2937]">
                  Trạng thái của bạn
                </p>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <PersonalStatus
                    label="Đăng ký"
                    value={isPendingApproval ? "Chờ host duyệt" : "Đã được duyệt"}
                    positive={isApproved}
                  />
                  <PersonalStatus
                    label="Thanh toán"
                    value={
                      isPendingApproval
                        ? "Chờ được duyệt"
                        : isPaid
                          ? "Đã đóng tiền"
                          : "Chưa đóng tiền"
                    }
                    positive={isApproved && isPaid}
                  />
                </div>
                {myBooking && (
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#D8E8FF] pt-3">
                    <span className="text-xs font-medium text-[#64748B]">
                      Trình độ đăng ký
                    </span>
                    <SkillLevelBadge level={myBooking.skill_level} />
                  </div>
                )}
                {isApproved && event.host?.phone && (
                  <p className="mt-3 text-sm text-[#0052CC]">
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
          </div>
        </div>
      </div>

      <Modal
        open={bookingModal}
        onClose={() => setBookingModal(false)}
        title="Đặt Chỗ Vãng Lai"
        className="max-w-xl"
      >
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-[#D8E8FF] bg-linear-to-r from-[#F4F8FF] to-white p-4">
            <p className="text-base font-semibold leading-snug text-[#1F2937]">
              {event.title}
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-[#6B7280] sm:grid-cols-2">
              <div className="rounded-xl bg-white/80 px-3 py-2">
                <p className="font-medium text-[#94A3B8]">Thời gian</p>
                <p className="mt-0.5 font-semibold text-[#1F2937]">
                  {formatTimeRange(
                    event.event_time,
                    event.event_end_time ?? null,
                    event.event_date,
                    event.event_end_date ?? null,
                  )}
                </p>
              </div>
              <div className="rounded-xl bg-white/80 px-3 py-2">
                <p className="font-medium text-[#94A3B8]">Địa điểm</p>
                <p className="mt-0.5 font-semibold text-[#1F2937]">
                  {event.location}
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[#1F2937]">
                Chọn trình độ
              </p>
              <p className="text-xs text-[#94A3B8]">Host sẽ duyệt theo level</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {availableRequirements.map((req) => (
              <button
                key={req.id}
                type="button"
                onClick={() => setSelectedLevel(req.skill_level)}
                className={`rounded-2xl border px-3 py-3 text-left transition-all ${
                  selectedLevel === req.skill_level
                    ? "border-[#0052CC] bg-[#E8F3FF] shadow-sm ring-2 ring-[#0052CC]/10"
                    : "border-[#E5E7EB] bg-white hover:border-[#9CC2FF] hover:bg-[#F9FBFF]"
                }`}
              >
                <div className="flex min-h-9 items-center justify-between gap-2">
                  <SkillLevelBadge level={req.skill_level} />
                  {selectedLevel === req.skill_level && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0052CC] text-[11px] font-bold text-white">
                      ✓
                    </span>
                  )}
                </div>
              </button>
            ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-[#FBFCFE] px-4 py-3">
            <p className="text-xs font-medium text-[#94A3B8]">Bạn đang chọn</p>
            <p className="mt-1 text-sm font-semibold text-[#1F2937]">
              {selectedLevel
                ? "Sẵn sàng gửi yêu cầu đặt chỗ"
                : "Chọn một trình độ để tiếp tục"}
            </p>
          </div>

          <Button
            size="lg"
            className="w-full rounded-2xl"
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

function DetailStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-[#FBFCFE] p-3">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-[#E8F3FF] text-[#0052CC]">
        {icon}
      </div>
      <p className="text-xs font-medium text-[#6B7280]">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-[#1F2937]">{value}</p>
    </div>
  );
}

function PersonalStatus({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive: boolean;
}) {
  return (
    <div className="rounded-xl border border-white bg-white/80 px-3 py-2.5">
      <p className="text-xs font-medium text-[#64748B]">{label}</p>
      <p
        className={`mt-0.5 text-sm font-semibold ${
          positive ? "text-emerald-700" : "text-amber-700"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
