"use client";

import { Clock, MapPin, Users } from "lucide-react";
import { EventStatusBadge } from "@/components/shared/EventStatusBadge";
import { SkillLevelBadge } from "@/components/shared/SkillLevelBadge";
import { formatDate, formatTime, cn } from "@/lib/utils";
import { formatDistance } from "@/lib/distance";
import type { Event } from "@/types";

interface EventListCompactProps {
  events: Event[];
  selectedEventId?: string | null;
  userLocation?: { lat: number; lng: number } | null;
  distances?: Record<string, number>;
  onSelect: (eventId: string) => void;
}

export function EventListCompact({
  events,
  selectedEventId,
  distances,
  onSelect,
}: EventListCompactProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <span className="text-3xl mb-3">🏸</span>
        <p className="text-sm font-medium text-[#1F2937]">
          Không tìm thấy vãng lai nào
        </p>
        <p className="text-xs text-[#9CA3AF] mt-1">
          Thử điều chỉnh bộ lọc hoặc mở rộng khu vực
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-[#F3F4F6]">
      {events.map((event) => {
        const totalSlots = event.total_slots;
        const filledSlots = event.booked_slots;
        const available = totalSlots - filledSlots;
        const dist = distances?.[event.id];
        const isSelected = selectedEventId === event.id;

        return (
          <button
            key={event.id}
            onClick={() => onSelect(event.id)}
            className={cn(
              "w-full text-left px-4 py-3.5 transition-all duration-150",
              isSelected
                ? "bg-[#E8F3FF] border-l-2 border-l-[#0052CC]"
                : "hover:bg-[#F9FAFB] border-l-2 border-l-transparent",
            )}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <p
                className={cn(
                  "text-sm font-semibold leading-snug line-clamp-2",
                  isSelected ? "text-[#0052CC]" : "text-[#1F2937]",
                )}
              >
                {event.title}
              </p>
              <EventStatusBadge status={event.status} />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                <Clock size={11} className="shrink-0" />
                <span>
                  {formatDate(event.event_date)} •{" "}
                  {formatTime(event.event_time)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                  <MapPin size={11} className="shrink-0" />
                  <span className="line-clamp-1 flex-1">{event.location}</span>
                </div>
                {dist !== undefined && (
                  <span className="text-xs text-[#0052CC] font-medium shrink-0 ml-2">
                    {formatDistance(dist)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <div className="flex flex-wrap gap-1">
                  {event.skill_requirements?.slice(0, 2).map((r) => (
                    <SkillLevelBadge
                      key={r.id}
                      level={r.skill_level}
                      className="text-[10px] px-1.5 py-0.5"
                    />
                  ))}
                  {(event.skill_requirements?.length ?? 0) > 2 && (
                    <span className="text-[10px] text-[#9CA3AF] self-center">
                      +{(event.skill_requirements?.length ?? 0) - 2}
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium",
                    available > 0 ? "text-emerald-600" : "text-[#9CA3AF]",
                  )}
                >
                  {available > 0 ? `${available} chỗ` : "Hết chỗ"}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
