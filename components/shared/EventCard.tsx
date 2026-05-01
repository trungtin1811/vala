import Link from "next/link";
import { MapPin, Clock, Users } from "lucide-react";
import { EventStatusBadge } from "./EventStatusBadge";
import { SkillLevelBadge } from "./SkillLevelBadge";
import { formatDate } from "@/lib/utils";
import { formatTimeRange } from "@/lib/eventTime";
import type { Event } from "@/types";

interface EventCardProps {
  event: Event;
  showManageAction?: boolean;
}

export function EventCard({ event, showManageAction = false }: EventCardProps) {
  const totalSlots = event.total_slots;
  const filledSlots = event.booked_slots;
  const availableSlots = totalSlots - filledSlots;

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 h-full flex flex-col">
      <Link href={`/events/${event.id}`} className="group flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-[#1F2937] text-base leading-tight line-clamp-2 group-hover:text-[#0052CC] transition-colors">
            {event.title}
          </h3>
          <EventStatusBadge status={event.status} />
        </div>

        <div className="mt-3 flex flex-col gap-2 text-sm text-[#6B7280]">
          <div className="flex items-center gap-2">
            <Clock size={14} className="shrink-0" />
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
          <div className="flex items-center gap-2">
            <MapPin size={14} className="shrink-0" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={14} className="shrink-0" />
            <span>
              {availableSlots > 0 ? `Còn ${availableSlots} chỗ` : "Hết chỗ"}
            </span>
          </div>
        </div>

        {event.skill_requirements && event.skill_requirements.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {event.skill_requirements.map((req) => (
              <SkillLevelBadge key={req.id} level={req.skill_level} />
            ))}
          </div>
        )}
      </Link>
      {event.host && (
        <div className="mt-3 flex items-center gap-2 pt-3 border-t border-[#F3F4F6]">
          {event.host.avatar_url ? (
            <img
              src={event.host.avatar_url}
              alt={event.host.display_name}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-[#E8F3FF] flex items-center justify-center text-[#0052CC] text-xs font-semibold">
              {event.host.display_name[0]?.toUpperCase()}
            </div>
          )}
          <span className="text-xs text-[#6B7280] flex-1">
            {event.host.display_name}
          </span>
          {showManageAction && (
            <Link
              href={`/events/${event.id}/manage`}
              className="text-xs font-medium text-[#0052CC] hover:text-[#003D99] transition-colors"
            >
              Duyệt member
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
