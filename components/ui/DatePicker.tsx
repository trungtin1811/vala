'use client'

import { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import { format, isToday, startOfDay } from 'date-fns'
import { vi } from 'date-fns/locale'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import 'react-day-picker/style.css'

interface DatePickerProps {
  value: string        // YYYY-MM-DD
  onChange: (value: string) => void
  error?: string
  label?: string
  id?: string
  disablePast?: boolean   // default true
  placeholder?: string
  compact?: boolean        // smaller button for filter UI
}

function parseDate(str: string): Date | undefined {
  if (!str) return undefined
  const d = new Date(str + 'T00:00:00')
  return isNaN(d.getTime()) ? undefined : d
}

function formatDisplay(d: Date) {
  return format(d, 'EEEE, dd/MM/yyyy', { locale: vi })
}

export function DatePicker({ value, onChange, error, label, id, disablePast = true, placeholder = 'Chọn ngày…', compact }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = parseDate(value)
  const today = startOfDay(new Date())

  useEffect(() => {
    if (!open) return
    function onOutside(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  function handleSelect(day: Date | undefined) {
    if (!day) return
    onChange(format(day, 'yyyy-MM-dd'))
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-1.5 relative" ref={ref}>
      {label && <label htmlFor={id} className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">{label}</label>}

      <button
        id={id}
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center gap-2 border bg-white text-left transition-colors focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 ${
          compact ? 'px-2.5 py-1.5 rounded-lg text-xs' : 'px-3 py-2.5 rounded-xl text-sm'
        } ${
          error ? 'border-[#EF4444]' : open ? 'border-[#0052CC]' : 'border-[#E5E7EB] hover:border-[#9CA3AF]'
        }`}
      >
        <CalendarDays size={compact ? 12 : 14} className="shrink-0 text-[#9CA3AF]" />
        {selected ? (
          <span className="text-[#1F2937]">{compact ? format(selected, 'dd/MM/yyyy') : formatDisplay(selected)}</span>
        ) : (
          <span className="text-[#9CA3AF]">{placeholder}</span>
        )}
      </button>

      {error && <p className="text-xs text-[#EF4444]">{error}</p>}

      {open && (
        <div className="absolute z-40 top-full mt-1 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl p-2">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            disabled={disablePast ? { before: today } : undefined}
            locale={vi}
            showOutsideDays
            components={{
              PreviousMonthButton: ({ ...props }) => (
                <button {...props} className="p-1.5 rounded-lg hover:bg-[#F3F4F6] text-[#6B7280]">
                  <ChevronLeft size={16} />
                </button>
              ),
              NextMonthButton: ({ ...props }) => (
                <button {...props} className="p-1.5 rounded-lg hover:bg-[#F3F4F6] text-[#6B7280]">
                  <ChevronRight size={16} />
                </button>
              ),
            }}
            classNames={{
              month_caption: 'flex items-center justify-center py-1 mb-2',
              caption_label: 'text-sm font-semibold text-[#1F2937]',
              nav: 'flex items-center justify-between absolute top-3 left-3 right-3',
              month_grid: 'w-full border-collapse',
              weekdays: 'flex',
              weekday: 'w-9 text-xs font-medium text-[#9CA3AF] text-center pb-1',
              weeks: 'flex flex-col gap-0.5',
              week: 'flex',
              day: 'w-9 h-9',
              day_button: 'w-9 h-9 text-sm rounded-xl transition-colors hover:bg-[#EFF6FF] hover:text-[#0052CC] focus:outline-none',
              selected: '[&>button]:!bg-[#0052CC] [&>button]:!text-white [&>button]:font-semibold',
              today: '[&>button]:font-bold [&>button]:border [&>button]:border-[#0052CC] [&>button]:text-[#0052CC]',
              disabled: '[&>button]:text-[#D1D5DB] [&>button]:cursor-not-allowed [&>button]:hover:bg-transparent [&>button]:hover:text-[#D1D5DB]',
              outside: '[&>button]:text-[#D1D5DB]',
              footer: 'flex items-center justify-between pt-2 border-t border-[#E5E7EB] mt-2',
            }}
            footer={
              <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB] mt-1">
                <button
                  type="button"
                  onClick={() => { onChange(''); setOpen(false) }}
                  className="text-sm text-[#0052CC] hover:underline px-1"
                >
                  Xóa
                </button>
                <button
                  type="button"
                  onClick={() => { onChange(format(today, 'yyyy-MM-dd')); setOpen(false) }}
                  className="text-sm text-[#0052CC] hover:underline px-1"
                >
                  Hôm nay
                </button>
              </div>
            }
          />
        </div>
      )}
    </div>
  )
}
