'use client'

import { useRef, useEffect, useState } from 'react'
import { SKILL_LEVELS, SKILL_LEVEL_LABELS, type FilterState } from '@/types'
import { SlidersHorizontal, X } from 'lucide-react'
import { DatePicker } from '@/components/ui/DatePicker'

interface FilterPanelProps {
  filters: FilterState
  onChange: (f: FilterState) => void
  hasLocation: boolean
}

export function FilterPanel({ filters, onChange, hasLocation }: FilterPanelProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const activeCount = [filters.skillLevel, filters.dateStart, filters.maxDistance !== undefined].filter(Boolean).length

  useEffect(() => {
    if (!open) return
    function onOutside(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#1F2937] transition-colors py-1"
      >
        <SlidersHorizontal size={14} />
        <span>Bộ lọc</span>
        {activeCount > 0 && (
          <span className="bg-[#0052CC] text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      {/* Dropdown — absolutely positioned so it doesn't break parent flex layout */}
      {open && (
        <div className="absolute top-full left-0 mt-2 z-30 w-72 flex flex-col gap-3 bg-white border border-[#E5E7EB] rounded-2xl shadow-lg p-4">

          {/* Skill level */}
          <div>
            <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Trình độ</label>
            <select
              value={filters.skillLevel ?? ''}
              onChange={e => onChange({ ...filters, skillLevel: e.target.value as any || undefined })}
              className="w-full text-sm border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-[#0052CC]"
            >
              <option value="">Tất cả</option>
              {SKILL_LEVELS.map(l => <option key={l} value={l}>{SKILL_LEVEL_LABELS[l]}</option>)}
            </select>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Từ ngày</label>
              <DatePicker
                compact
                disablePast={false}
                placeholder="Từ ngày"
                value={filters.dateStart ?? ''}
                onChange={v => onChange({ ...filters, dateStart: v || undefined })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Đến ngày</label>
              <DatePicker
                compact
                disablePast={false}
                placeholder="Đến ngày"
                value={filters.dateEnd ?? ''}
                onChange={v => onChange({ ...filters, dateEnd: v || undefined })}
              />
            </div>
          </div>

          {/* Distance */}
          {hasLocation && (
            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
                Bán kính: {filters.maxDistance !== undefined ? `${filters.maxDistance} km` : 'Tất cả'}
              </label>
              <input
                type="range"
                min={1}
                max={50}
                step={1}
                value={filters.maxDistance ?? 50}
                onChange={e => onChange({ ...filters, maxDistance: Number(e.target.value) })}
                className="w-full accent-[#0052CC]"
              />
              <div className="flex justify-between text-[10px] text-[#9CA3AF] mt-0.5">
                <span>1km</span><span>50km</span>
              </div>
              {filters.maxDistance !== undefined && (
                <button
                  type="button"
                  onClick={() => onChange({ ...filters, maxDistance: undefined })}
                  className="mt-1 text-xs text-[#0052CC] hover:underline"
                >
                  Xoá bán kính
                </button>
              )}
            </div>
          )}

          {/* Clear all */}
          {activeCount > 0 && (
            <button
              type="button"
              onClick={() => onChange({ ...filters, skillLevel: undefined, dateStart: undefined, dateEnd: undefined, maxDistance: undefined })}
              className="flex items-center gap-1 text-xs text-[#EF4444] hover:underline"
            >
              <X size={11} /> Xoá tất cả bộ lọc
            </button>
          )}
        </div>
      )}
    </div>
  )
}
