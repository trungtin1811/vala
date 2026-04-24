"use client";

import Link from "next/link";
import { Clock, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EventStatusBadge } from "@/components/shared/EventStatusBadge";
import { SkillLevelBadge } from "@/components/shared/SkillLevelBadge";
import { formatDate } from "@/lib/utils";
import { formatTimeRange } from "@/lib/eventTime";
import { formatDistance } from "@/lib/distance";
import type { Event } from "@/types";

interface MapPopupProps {
  event: Event;
  distanceKm?: number;
  onBook?: () => void;
}

export function MapPopupContent({ event, distanceKm, onBook }: MapPopupProps) {
  const totalSlots = event.total_slots;
  const filledSlots = event.booked_slots;
  const available = totalSlots - filledSlots;

  return (
    <div className="w-60">
      <div className="bg-gradient-to-r from-[#0052CC] to-[#0066FF] px-4 py-3">
        <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2">
          {event.title}
        </h3>
        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          <EventStatusBadge status={event.status} />
          {distanceKm !== undefined && (
            <span className="text-white/70 text-xs">
              {formatDistance(distanceKm)}
            </span>
          )}
        </div>
      </div>
      <div className="px-4 py-3 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs text-[#6B7280]">
          <Clock size={12} className="shrink-0" />
          <span>
            {formatDate(event.event_date)} •{" "}
            {formatTimeRange(
              event.event_time,
              event.event_end_time ?? null,
              event.event_date,
              event.event_end_date ?? null,
            )}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#6B7280]">
          <MapPin size={12} className="shrink-0" />
          <span className="line-clamp-1">{event.location}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#6B7280]">
          <Users size={12} className="shrink-0" />
          <span>{available > 0 ? `Còn ${available} chỗ` : "Hết chỗ"}</span>
        </div>
        {event.skill_requirements && event.skill_requirements.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {event.skill_requirements.map((r) => (
              <SkillLevelBadge
                key={r.id}
                level={r.skill_level}
                className="text-[10px] px-1.5 py-0.5"
              />
            ))}
          </div>
        )}
        <div className="flex gap-2 pt-1">
          <Link href={`/events/${event.id}`} className="flex-1">
            <Button
              variant="secondary"
              size="sm"
              className="w-full text-xs py-1.5"
            >
              Chi Tiết
            </Button>
          </Link>
          {event.status === "active" && available > 0 && (
            <Button
              size="sm"
              className="flex-1 text-xs py-1.5"
              onClick={onBook}
            >
              Đặt Chỗ
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
