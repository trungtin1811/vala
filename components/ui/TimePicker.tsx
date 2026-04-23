'use client'

import { useState, useRef, useEffect } from 'react'
import { Clock, ChevronDown } from 'lucide-react'
import { isToday, parse, isBefore } from 'date-fns'

function generateSlots(): string[] {
  const slots: string[] = []
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return slots
}

const ALL_SLOTS = generateSlots()

interface TimePickerProps {
  value: string       // HH:mm
  onChange: (value: string) => void
  selectedDate?: string  // YYYY-MM-DD — used to disable past times when date is today
  label?: string
  id?: string
  error?: string
  placeholder?: string
}

function isPastSlot(slot: string, selectedDate?: string): boolean {
  if (!selectedDate) return false
  const dateObj = new Date(selectedDate + 'T00:00:00')
  if (!isToday(dateObj)) return false
  const now = new Date()
  const slotDate = parse(slot, 'HH:mm', dateObj)
  return isBefore(slotDate, now)
}

export function TimePicker({ value, onChange, selectedDate, label, id, error, placeholder = 'Chọn giờ…' }: TimePickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (!open) return
    function onOutside(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  // Scroll selected into view when opening
  useEffect(() => {
    if (!open || !listRef.current || !value) return
    const el = listRef.current.querySelector('[data-selected="true"]') as HTMLElement
    if (el) el.scrollIntoView({ block: 'center' })
  }, [open, value])

  return (
    <div className="flex flex-col gap-1.5 relative" ref={ref}>
      {label && <label htmlFor={id} className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">{label}</label>}

      <button
        id={id}
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center gap-2 px-3 py-2.5 border rounded-xl text-sm bg-white text-left transition-colors focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 ${
          error ? 'border-[#EF4444]' : open ? 'border-[#0052CC]' : 'border-[#E5E7EB] hover:border-[#9CA3AF]'
        }`}
      >
        <Clock size={14} className="shrink-0 text-[#9CA3AF]" />
        <span className={`flex-1 ${value ? 'text-[#1F2937]' : 'text-[#9CA3AF]'}`}>
          {value || placeholder}
        </span>
        <ChevronDown size={14} className={`shrink-0 text-[#9CA3AF] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {error && <p className="text-xs text-[#EF4444]">{error}</p>}

      {open && (
        <div className="absolute z-40 top-full mt-1 w-full bg-white border border-[#E5E7EB] rounded-xl shadow-lg overflow-hidden">
          <ul ref={listRef} className="max-h-52 overflow-y-auto py-1">
            {ALL_SLOTS.map(slot => {
              const past = isPastSlot(slot, selectedDate)
              const selected = slot === value
              return (
                <li key={slot}>
                  <button
                    type="button"
                    disabled={past}
                    data-selected={selected}
                    onClick={() => { onChange(slot); setOpen(false) }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      past
                        ? 'text-[#D1D5DB] cursor-not-allowed'
                        : selected
                          ? 'bg-[#0052CC] text-white font-semibold'
                          : 'text-[#1F2937] hover:bg-[#EFF6FF] hover:text-[#0052CC]'
                    }`}
                  >
                    {slot}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
