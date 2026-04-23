'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Shuffle, Pencil, Trash2, Phone } from 'lucide-react'
import { useEvent } from '@/hooks/useEvents'
import { useEventBookings, useCancelBooking } from '@/hooks/useBookings'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SkillLevelBadge } from '@/components/shared/SkillLevelBadge'
import { EventStatusBadge } from '@/components/shared/EventStatusBadge'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import type { Booking, EventStatus } from '@/types'

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateTeams(bookings: Booking[], numCourts: number) {
  const shuffled = shuffleArray(bookings)
  const teams: Booking[][] = Array.from({ length: numCourts }, () => [])
  shuffled.forEach((b, i) => teams[i % numCourts].push(b))
  return teams
}

export default function ManageEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const qc = useQueryClient()
  const { data: event, isLoading } = useEvent(id)
  const { data: bookings } = useEventBookings(id)
  const cancelBooking = useCancelBooking()

  const [teamsModal, setTeamsModal] = useState(false)
  const [numCourts, setNumCourts] = useState(2)
  const [teams, setTeams] = useState<Booking[][]>([])
  const [statusLoading, setStatusLoading] = useState(false)

  if (isLoading) return null
  if (!event || event.host_id !== user?.id) {
    return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-[#6B7280]">Không có quyền truy cập.</div>
  }

  async function updateStatus(status: EventStatus) {
    setStatusLoading(true)
    await supabase.from('events').update({ status }).eq('id', id)
    qc.invalidateQueries({ queryKey: ['event', id] })
    setStatusLoading(false)
  }

  function handleGenerateTeams() {
    if (!bookings) return
    setTeams(generateTeams(bookings, numCourts))
  }

  const teamColors = ['bg-blue-50 border-blue-200', 'bg-emerald-50 border-emerald-200', 'bg-amber-50 border-amber-200', 'bg-purple-50 border-purple-200', 'bg-red-50 border-red-200']

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link href={`/events/${id}`} className="inline-flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#0052CC] mb-6 transition-colors">
        <ChevronLeft size={16} /> Chi tiết vãng lai
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#1F2937]">{event.title}</h1>
          <div className="mt-1"><EventStatusBadge status={event.status} /></div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/events/${id}/edit`}>
            <Button variant="secondary" size="sm"><Pencil size={14} /> Chỉnh sửa</Button>
          </Link>
          {event.status === 'active' && (
            <Button variant="secondary" size="sm" onClick={() => updateStatus('closed')} loading={statusLoading}>
              Đóng Tuyển
            </Button>
          )}
          {event.status === 'closed' && (
            <Button variant="secondary" size="sm" onClick={() => updateStatus('active')} loading={statusLoading}>
              Mở Lại
            </Button>
          )}
          {(event.status === 'active' || event.status === 'closed') && (
            <Button variant="secondary" size="sm" onClick={() => updateStatus('completed')} loading={statusLoading}>
              Hoàn Thành
            </Button>
          )}
          <Button variant="danger" size="sm" onClick={() => updateStatus('cancelled')} loading={statusLoading}>
            Huỷ
          </Button>
        </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-2xl">
        <div className="flex items-center justify-between p-4 border-b border-[#F3F4F6]">
          <h2 className="font-semibold text-[#1F2937]">Danh Sách Thành Viên ({bookings?.length ?? 0})</h2>
          {bookings && bookings.length >= 2 && (
            <Button size="sm" onClick={() => { handleGenerateTeams(); setTeamsModal(true) }}>
              <Shuffle size={14} /> Chia Sân
            </Button>
          )}
        </div>

        {!bookings || bookings.length === 0 ? (
          <div className="py-12 text-center text-[#9CA3AF] text-sm">Chưa có thành viên nào đăng ký</div>
        ) : (
          <div className="divide-y divide-[#F3F4F6]">
            {bookings.map(booking => (
              <div key={booking.id} className="flex items-center gap-3 px-4 py-3">
                {booking.member?.avatar_url ? (
                  <img src={booking.member.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#E8F3FF] flex items-center justify-center text-[#0052CC] font-semibold text-sm">
                    {booking.member?.display_name[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1F2937]">{booking.member?.display_name}</p>
                  {booking.member?.phone && (
                    <p className="text-xs text-[#6B7280] flex items-center gap-1">
                      <Phone size={10} />{booking.member.phone}
                    </p>
                  )}
                </div>
                <SkillLevelBadge level={booking.skill_level} />
                <button
                  onClick={() => cancelBooking.mutate({ bookingId: booking.id, eventId: id, skillLevel: booking.skill_level })}
                  className="text-[#9CA3AF] hover:text-[#EF4444] transition-colors p-1 ml-1"
                  title="Xoá thành viên"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={teamsModal} onClose={() => setTeamsModal(false)} title="Chia Sân Ngẫu Nhiên" className="max-w-2xl">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-[#1F2937]">Số sân:</label>
            <input
              type="number"
              min={2}
              max={10}
              value={numCourts}
              onChange={e => setNumCourts(Number(e.target.value))}
              className="w-16 border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm text-center focus:outline-none focus:border-[#0052CC]"
            />
            <Button size="sm" variant="secondary" onClick={handleGenerateTeams}>
              <Shuffle size={14} /> Random lại
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {teams.map((team, i) => (
              <div key={i} className={`rounded-xl border p-3 ${teamColors[i % teamColors.length]}`}>
                <p className="text-xs font-bold uppercase tracking-wide mb-2 text-[#1F2937]">Sân {i + 1}</p>
                <div className="flex flex-col gap-2">
                  {team.map(b => (
                    <div key={b.id} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[#0052CC] text-xs font-semibold">
                        {b.member?.display_name[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm text-[#1F2937] flex-1">{b.member?.display_name}</span>
                      <SkillLevelBadge level={b.skill_level} className="text-[10px] px-1.5 py-0.5" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}
