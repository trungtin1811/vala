'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useMyEvents } from '@/hooks/useEvents'
import { useMyBookings } from '@/hooks/useBookings'
import { EventCard } from '@/components/shared/EventCard'
import { EventCardSkeleton } from '@/components/shared/EventCardSkeleton'
import { Button } from '@/components/ui/Button'
import { Plus } from 'lucide-react'
import type { Event } from '@/types'

const TABS = [
  { key: 'hosted', label: 'Vãng Lai Của Tôi' },
  { key: 'joined', label: 'Đã Đăng Ký' },
] as const
type TabKey = typeof TABS[number]['key']

function EventGrid({ loading, events, emptyMsg }: {
  loading: boolean
  events: Event[] | undefined
  emptyMsg: string
}) {
  if (loading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => <EventCardSkeleton key={i} />)}
    </div>
  )
  if (!events || events.length === 0) return (
    <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl py-16 text-center">
      <p className="text-[#9CA3AF] text-sm">{emptyMsg}</p>
    </div>
  )
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {events.map(event => <EventCard key={event.id} event={event} />)}
    </div>
  )
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabKey>('hosted')

  const { data: myEvents, isLoading: eventsLoading } = useMyEvents(user?.id)
  const { data: myBookings, isLoading: bookingsLoading } = useMyBookings(user?.id)

  if (loading) return null
  if (!user) { router.push('/'); return null }

  const bookedEvents = myBookings?.map(b => b.event).filter(Boolean) as Event[] | undefined

  const hostedCount = myEvents?.length ?? 0
  const joinedCount = bookedEvents?.length ?? 0

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[#1F2937]">Xin chào, {user.display_name} 👋</h1>
          <p className="text-[#6B7280] mt-1">Quản lý vãng lai và lịch đặt của bạn</p>
        </div>
        <Link href="/events/create">
          <Button><Plus size={16} /> Tạo Vãng Lai</Button>
        </Link>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex items-center justify-between border-b border-[#E5E7EB]">
          <div className="flex">
            {TABS.map(tab => {
              const count = tab.key === 'hosted' ? hostedCount : joinedCount
              const active = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative px-5 py-3 text-sm font-medium transition-colors focus:outline-none ${
                    active ? 'text-[#0052CC]' : 'text-[#6B7280] hover:text-[#1F2937]'
                  }`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                      active ? 'bg-[#EFF6FF] text-[#0052CC]' : 'bg-[#F3F4F6] text-[#9CA3AF]'
                    }`}>
                      {count}
                    </span>
                  )}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0052CC] rounded-t-full" />
                  )}
                </button>
              )
            })}
          </div>

          {activeTab === 'hosted' ? (
            <Link href="/events/create" className="text-sm text-[#0052CC] hover:underline pb-3">
              + Tạo mới
            </Link>
          ) : (
            <Link href="/events" className="text-sm text-[#0052CC] hover:underline pb-3">
              Tìm vãng lai
            </Link>
          )}
        </div>

        <div className="pt-6">
          {activeTab === 'hosted' ? (
            <EventGrid
              loading={eventsLoading}
              events={myEvents}
              emptyMsg="Bạn chưa tổ chức vãng lai nào. Hãy tạo ngay!"
            />
          ) : (
            <EventGrid
              loading={bookingsLoading}
              events={bookedEvents}
              emptyMsg="Bạn chưa đăng ký vãng lai nào."
            />
          )}
        </div>
      </div>
    </div>
  )
}
