'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { EventForm, type EventFormValues } from '@/components/shared/EventForm'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { computeEndDate } from '@/lib/eventTime'
import { format, addDays } from 'date-fns'

function generateRepeatDates(startDate: string, repeatDays: number[], untilDate: string): string[] {
  const dates: string[] = []
  const start = new Date(startDate + 'T00:00:00')
  const end   = new Date(untilDate  + 'T00:00:00')
  if (end < start || repeatDays.length === 0) return [startDate]
  const cur = new Date(start)
  while (cur <= end) {
    if (repeatDays.includes(cur.getDay())) {
      dates.push(format(cur, 'yyyy-MM-dd'))
    }
    cur.setDate(cur.getDate() + 1)
  }
  return dates.length > 0 ? dates : [startDate]
}

export default function CreateEventPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading) return null

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-[#6B7280] mb-4">Bạn cần đăng nhập để tạo vãng lai.</p>
        <Link href="/"><Button>Đăng Nhập</Button></Link>
      </div>
    )
  }

  async function handleSubmit(values: EventFormValues) {
    setSubmitting(true)
    setError(null)
    try {
      const dates = values.repeat_enabled && values.repeat_days.length > 0 && values.repeat_until
        ? generateRepeatDates(values.event_date, values.repeat_days, values.repeat_until)
        : [values.event_date]

      let firstEventId: string | null = null

      for (const date of dates) {
        const { data: event, error: eventError } = await supabase
          .from('events')
          .insert({
            host_id: user!.id,
            title: values.title,
            description: values.description || null,
            location: values.location,
            latitude: values.latitude,
            longitude: values.longitude,
            event_date: date,
            event_time: values.event_time,
            event_end_time: values.event_end_time || null,
            event_end_date: computeEndDate(date, values.event_time, values.event_end_time),
            status: 'active',
            token_cost: 0,
            price_min: values.price_enabled ? (values.price_min ?? null) : null,
            price_max: values.price_enabled ? (values.price_max ?? null) : null,
            split_evenly: values.price_enabled ? values.split_evenly : false,
          })
          .select()
          .single()

        if (eventError) throw eventError
        if (!firstEventId) firstEventId = event.id

        const requirements = values.skill_levels.map(level => ({
          event_id: event.id,
          skill_level: level,
          slots_needed: values.total_slots,
          slots_booked: 0,
        }))

        const { error: reqError } = await supabase.from('event_skill_requirements').insert(requirements)
        if (reqError) throw reqError
      }

      router.push(dates.length > 1 ? '/dashboard' : `/events/${firstEventId}`)
    } catch (e: any) {
      setError(e.message ?? 'Có lỗi xảy ra')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/events" className="inline-flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#0052CC] mb-6 transition-colors">
        <ChevronLeft size={16} /> Quay lại
      </Link>
      <h1 className="text-2xl font-bold text-[#1F2937] mb-6">Tạo Vãng Lai</h1>
      {error && <p className="mb-4 text-sm text-[#EF4444] bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}
      <EventForm onSubmit={handleSubmit} onCancel={() => router.back()} loading={submitting} />
    </div>
  )
}
