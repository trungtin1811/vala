"use client";

import { useState } from "react";
import { useEvents } from "@/hooks/useEvents";
import { EventCard } from "@/components/shared/EventCard";
import { EventCardSkeleton } from "@/components/shared/EventCardSkeleton";
import { Select } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";
import {
  SKILL_LEVELS,
  SKILL_LEVEL_LABELS,
  type EventStatus,
  type Event,
  type SkillLevel,
} from "@/types";
import { computeEndDate } from "@/lib/eventTime";
import {
  CalendarDays,
  RotateCcw,
  Search,
  SearchX,
  SlidersHorizontal,
} from "lucide-react";

const EVENT_STATUS_OPTIONS: Array<{
  value: EventStatus;
  label: string;
}> = [
  { value: "active", label: "Đang tuyển" },
  { value: "closed", label: "Đã đủ người" },
  { value: "completed", label: "Hoàn thành" },
  { value: "cancelled", label: "Đã huỷ" },
];
const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Mọi trạng thái" },
  ...EVENT_STATUS_OPTIONS,
];
const SKILL_FILTER_OPTIONS = [
  { value: "all", label: "Mọi trình độ" },
  ...SKILL_LEVELS.map((level) => ({
    value: level,
    label: SKILL_LEVEL_LABELS[level],
  })),
];

export default function EventsPage() {
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [skillLevel, setSkillLevel] = useState<SkillLevel | "">("");
  const [status, setStatus] = useState<EventStatus | "">("");

  const {
    data: events,
    isLoading,
    error,
  } = useEvents({
    location: location || undefined,
    date: date || undefined,
    status: status || undefined,
  });

  const filtered = skillLevel
    ? events?.filter(
        (e) =>
          e.skill_requirements?.some((r) => r.skill_level === skillLevel) &&
          e.booked_slots < e.total_slots,
      )
    : events;

  // Remove events that have already ended
  const now = new Date();
  const isEventActiveNow = (e: Event) => {
    try {
      const endDate =
        e.event_end_date ??
        computeEndDate(
          e.event_date,
          e.event_time,
          e.event_end_time ?? e.event_time,
        );
      const endTime = e.event_end_time ?? e.event_time;
      if (!endDate || !endTime) return true;
      const [y, m, d] = endDate.split("-").map(Number);
      const [hh, mm] = endTime.split(":").map(Number);
      const endDt = new Date(y, m - 1, d, hh, mm, 0);
      return endDt >= now;
    } catch {
      return true;
    }
  };

  const visibleEvents = filtered?.filter(isEventActiveNow) ?? [];
  const activeFilters = [location, date, status, skillLevel].filter(
    Boolean,
  ).length;
  const openSlotCount = visibleEvents.reduce(
    (sum, event) => sum + Math.max(event.total_slots - event.booked_slots, 0),
    0,
  );

  function resetFilters() {
    setLocation("");
    setDate("");
    setStatus("");
    setSkillLevel("");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#E8F3FF] px-3 py-1 text-xs font-semibold text-[#0052CC]">
            <CalendarDays size={13} />
            Lịch giao lưu
          </p>
          <h1 className="text-3xl font-bold tracking-normal text-[#1F2937]">
            Tìm Vãng Lai
          </h1>
          <p className="mt-2 text-base text-[#6B7280]">
            Khám phá các buổi vãng lai cầu lông gần bạn
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-[#6B7280]">Đang hiển thị</p>
            <p className="mt-0.5 text-2xl font-bold text-[#1F2937]">
              {isLoading ? "-" : visibleEvents.length}
            </p>
          </div>
          <div className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-[#6B7280]">Slot còn trống</p>
            <p className="mt-0.5 text-2xl font-bold text-[#0052CC]">
              {isLoading ? "-" : openSlotCount}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-7 rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1F2937]">
            <SlidersHorizontal size={16} className="text-[#0052CC]" />
            Bộ lọc
          </div>
          {activeFilters > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-[#0052CC] hover:bg-[#E8F3FF]"
            >
              <RotateCcw size={12} />
              Xóa {activeFilters}
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(16rem,1fr)_12rem_12rem_12rem]">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
            />
            <input
              type="text"
              placeholder="Tìm theo địa điểm..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-[42px] w-full rounded-xl border border-[#E5E7EB] bg-[#FBFCFE] pl-10 pr-3 text-sm transition-colors focus:border-[#0052CC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20"
            />
          </div>
          <DatePicker
            value={date}
            onChange={setDate}
            disablePast={false}
            placeholder="dd/mm/yyyy"
            compact
          />
          <Select
            value={status || "all"}
            onValueChange={(value) =>
              setStatus(value === "all" ? "" : (value as EventStatus))
            }
            options={STATUS_FILTER_OPTIONS}
          />
          <Select
            value={skillLevel || "all"}
            onValueChange={(value) =>
              setSkillLevel(value === "all" ? "" : (value as SkillLevel))
            }
            options={SKILL_FILTER_OPTIONS}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 py-10 text-center text-[#EF4444]">
          Có lỗi xảy ra. Vui lòng thử lại.
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : visibleEvents && visibleEvents.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-[#D1D5DB] bg-[#FBFCFE] px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F3FF] text-[#0052CC]">
            <SearchX size={24} />
          </div>
          <h3 className="text-lg font-semibold text-[#1F2937]">
            Không có vãng lai nào
          </h3>
          <p className="mt-2 text-[#6B7280]">
            Thử thay đổi bộ lọc hoặc quay lại sau nhé!
          </p>
          {activeFilters > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0052CC] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#003D99]"
            >
              <RotateCcw size={15} />
              Xóa bộ lọc
            </button>
          )}
        </div>
      )}
    </div>
  );
}
