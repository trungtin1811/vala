import Link from 'next/link'
import { MapPin, Clock, Users } from 'lucide-react'
import { EventStatusBadge } from './EventStatusBadge'
import { SkillLevelBadge } from './SkillLevelBadge'
import { formatDate, formatTime } from '@/lib/utils'
import { formatTimeRange } from '@/lib/eventTime'
import type { Event } from '@/types'

interface EventCardProps {
  event: Event
}

export function EventCard({ event }: EventCardProps) {
  const totalSlots = event.skill_requirements?.reduce((s, r) => s + r.slots_needed, 0) ?? 0
  const filledSlots = event.skill_requirements?.reduce((s, r) => s + r.slots_booked, 0) ?? 0
  const availableSlots = totalSlots - filledSlots

  return (
    <Link href={`/events/${event.id}`} className="block group">
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer h-full flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-[#1F2937] text-base leading-tight line-clamp-2 group-hover:text-[#0052CC] transition-colors">
            {event.title}
          </h3>
          <EventStatusBadge status={event.status} />
        </div>

        <div className="flex flex-col gap-2 text-sm text-[#6B7280]">
          <div className="flex items-center gap-2">
            <Clock size={14} className="shrink-0" />
            <span>{formatDate(event.event_date)} • {formatTimeRange(event.event_time, event.event_end_time ?? null, event.event_date, event.event_end_date ?? null)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={14} className="shrink-0" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={14} className="shrink-0" />
            <span>{availableSlots > 0 ? `Còn ${availableSlots} chỗ` : 'Hết chỗ'}</span>
          </div>
        </div>

        {event.skill_requirements && event.skill_requirements.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto">
            {event.skill_requirements.map(req => (
              <div key={req.id} className="flex items-center gap-1">
                <SkillLevelBadge level={req.skill_level} />
                <span className="text-xs text-[#9CA3AF]">
                  {req.slots_booked}/{req.slots_needed}
                </span>
              </div>
            ))}
          </div>
        )}

        {event.host && (
          <div className="flex items-center gap-2 pt-3 border-t border-[#F3F4F6]">
            {event.host.avatar_url ? (
              <img src={event.host.avatar_url} alt={event.host.display_name} className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[#E8F3FF] flex items-center justify-center text-[#0052CC] text-xs font-semibold">
                {event.host.display_name[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-xs text-[#6B7280]">{event.host.display_name}</span>
          </div>
        )}
      </div>
    </Link>
  )
}
