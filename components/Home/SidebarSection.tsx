'use client'

import { Search, Plus, ArrowUpDown, MapPin } from 'lucide-react'
import { FilterPanel } from './FilterPanel'
import { EventListCompact } from './EventListCompact'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import type { Event, FilterState } from '@/types'

interface SidebarSectionProps {
  events: Event[]
  filteredEvents: Event[]
  filters: FilterState
  onFilterChange: (f: FilterState) => void
  selectedEventId?: string | null
  onEventSelect: (eventId: string) => void
  userLocation?: { lat: number; lng: number } | null
  distances?: Record<string, number>
  isLoading?: boolean
  onLocate?: () => void
  hasLocation: boolean
}

const SORT_LABELS: Record<FilterState['sortBy'], string> = {
  distance: 'Gần nhất',
  date: 'Ngày gần nhất',
  slots: 'Còn nhiều chỗ',
}

export function SidebarSection({
  events,
  filteredEvents,
  filters,
  onFilterChange,
  selectedEventId,
  onEventSelect,
  userLocation,
  distances,
  isLoading,
  onLocate,
  hasLocation,
}: SidebarSectionProps) {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[#F3F4F6] shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-[#1F2937] text-sm">
            Vãng Lai {filteredEvents.length > 0 && <span className="text-[#9CA3AF] font-normal">({filteredEvents.length})</span>}
          </h2>
          <Link href="/events/create">
            <Button size="sm" className="text-xs py-1.5 px-3 gap-1">
              <Plus size={12} /> Tạo mới
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Tìm tên, địa điểm..."
            value={filters.searchQuery}
            onChange={e => onFilterChange({ ...filters, searchQuery: e.target.value })}
            className="w-full pl-8 pr-3 py-2 text-sm border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20"
          />
        </div>

        {/* Filters + Sort */}
        <div className="flex items-center justify-between">
          <FilterPanel filters={filters} onChange={onFilterChange} hasLocation={hasLocation} />
          <div className="flex items-center gap-2">
            {!hasLocation && onLocate && (
              <button onClick={onLocate} className="flex items-center gap-1 text-xs text-[#0052CC] hover:underline">
                <MapPin size={11} /> Định vị
              </button>
            )}
            <select
              value={filters.sortBy}
              onChange={e => onFilterChange({ ...filters, sortBy: e.target.value as FilterState['sortBy'] })}
              className="text-xs border border-[#E5E7EB] rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-[#0052CC] cursor-pointer"
            >
              {(Object.keys(SORT_LABELS) as FilterState['sortBy'][]).map(k => (
                <option key={k} value={k} disabled={k === 'distance' && !hasLocation}>
                  {SORT_LABELS[k]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Event list */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {isLoading ? (
          <div className="flex flex-col divide-y divide-[#F3F4F6]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-4 animate-pulse">
                <div className="h-4 bg-[#E5E7EB] rounded w-3/4 mb-2" />
                <div className="h-3 bg-[#E5E7EB] rounded w-1/2 mb-1" />
                <div className="h-3 bg-[#E5E7EB] rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <EventListCompact
            events={filteredEvents}
            selectedEventId={selectedEventId}
            userLocation={userLocation}
            distances={distances}
            onSelect={onEventSelect}
          />
        )}
      </div>
    </div>
  )
}
