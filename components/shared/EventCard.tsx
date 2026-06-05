import Link from "next/link";
import { ArrowRight, Clock, MapPin, Users, Wallet } from "lucide-react";
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
  const priceLabel = formatPrice(event);
  const visibleSkillRequirements = event.skill_requirements?.slice(0, 4) ?? [];
  const hiddenSkillCount = Math.max(
    (event.skill_requirements?.length ?? 0) - visibleSkillRequirements.length,
    0,
  );

  return (
    <div className="group bg-white border border-[#E5E7EB] rounded-2xl shadow-sm hover:shadow-xl hover:border-[#B7D2FF] hover:-translate-y-0.5 transition-all duration-200 h-full flex flex-col overflow-hidden">
      <Link href={`/events/${event.id}`} className="group flex flex-1 flex-col">
        <div className="p-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <EventStatusBadge status={event.status} />
              <h3 className="mt-3 font-semibold text-[#1F2937] text-lg leading-tight line-clamp-2 group-hover:text-[#0052CC] transition-colors">
                {event.title}
              </h3>
            </div>
            <div className="shrink-0 rounded-2xl bg-[#F4F8FF] px-3 py-2 text-center">
              <p className="text-xl font-bold leading-none text-[#0052CC]">
                {Math.max(availableSlots, 0)}
              </p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase text-[#6B7280]">
                chỗ
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2.5 text-sm text-[#6B7280]">
            <div className="flex items-start gap-2">
              <Clock size={15} className="mt-0.5 shrink-0 text-[#0052CC]" />
              <span className="leading-snug">
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
              <MapPin size={15} className="shrink-0 text-[#0052CC]" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={15} className="shrink-0 text-[#0052CC]" />
              <span>
                {filledSlots}/{totalSlots} người đã đặt
              </span>
            </div>
            {priceLabel && (
              <div className="flex items-center gap-2">
                <Wallet size={15} className="shrink-0 text-[#0052CC]" />
                <span>{priceLabel}</span>
              </div>
            )}
          </div>

          {visibleSkillRequirements.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {visibleSkillRequirements.map((req) => (
                <SkillLevelBadge
                  key={req.id}
                  level={req.skill_level}
                  className="px-2 py-0.5 text-[11px]"
                />
              ))}
              {hiddenSkillCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[11px] font-semibold text-[#6B7280]">
                  +{hiddenSkillCount}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-[#F3F4F6] bg-[#FBFCFE] px-5 py-3 text-sm font-semibold text-[#0052CC]">
          <span>Xem chi tiết</span>
          <ArrowRight
            size={16}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </div>
      </Link>
      {event.host && (
        <div className="flex items-center gap-2 border-t border-[#F3F4F6] px-5 py-3">
          {event.host.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
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

function formatPrice(event: Event) {
  const min = event.price_min;
  const max = event.price_max;

  if (min == null && max == null) return null;

  const formatCurrency = (value: number) => `${value.toLocaleString("vi-VN")}đ`;

  if (min != null && max != null && min !== max) {
    return `${formatCurrency(min)} - ${formatCurrency(max)}`;
  }

  return `${formatCurrency(min ?? max ?? 0)}${event.split_evenly ? " chia đều" : ""}`;
}
