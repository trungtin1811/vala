'use client'

import { useState } from 'react'
import { useEvents } from '@/hooks/useEvents'
import { EventCard } from '@/components/shared/EventCard'
import { EventCardSkeleton } from '@/components/shared/EventCardSkeleton'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { SKILL_LEVELS, SKILL_LEVEL_LABELS, type SkillLevel } from '@/types'
import { Search } from 'lucide-react'

export default function EventsPage() {
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')
  const [skillLevel, setSkillLevel] = useState<SkillLevel | ''>('')

  const { data: events, isLoading, error } = useEvents({
    location: location || undefined,
    date: date || undefined,
  })

  const filtered = skillLevel
    ? events?.filter(e => e.skill_requirements?.some(r => r.skill_level === skillLevel && r.slots_booked < r.slots_needed))
    : events

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1F2937] mb-1">Tìm Vãng Lai</h1>
        <p className="text-[#6B7280]">Khám phá các buổi vãng lai cầu lông gần bạn</p>
      </div>

      <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Tìm theo địa điểm..."
            value={location}
            onChange={e => setLocation(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20 bg-white"
          />
        </div>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="px-3 py-2.5 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20 bg-white"
        />
        <select
          value={skillLevel}
          onChange={e => setSkillLevel(e.target.value as SkillLevel | '')}
          className="px-3 py-2.5 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20 bg-white cursor-pointer"
        >
          <option value="">Mọi trình độ</option>
          {SKILL_LEVELS.map(l => (
            <option key={l} value={l}>{SKILL_LEVEL_LABELS[l]}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="text-center py-12 text-[#EF4444]">Có lỗi xảy ra. Vui lòng thử lại.</div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} />)}
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(event => <EventCard key={event.id} event={event} />)}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🏸</div>
          <h3 className="text-lg font-semibold text-[#1F2937] mb-2">Không có vãng lai nào</h3>
          <p className="text-[#6B7280]">Thử thay đổi bộ lọc hoặc quay lại sau nhé!</p>
        </div>
      )}
    </div>
  )
}
