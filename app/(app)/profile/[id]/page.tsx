'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { SkillLevelBadge } from '@/components/shared/SkillLevelBadge'
import { EventCard } from '@/components/shared/EventCard'
import type { User, Event } from '@/types'

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('users').select('*').eq('id', id).single()
      if (error) throw error
      return data as User
    },
  })

  const { data: hostedEvents } = useQuery({
    queryKey: ['user-events', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('events')
        .select('*, skill_requirements:event_skill_requirements(*)')
        .eq('host_id', id)
        .in('status', ['active', 'closed'])
        .order('event_date', { ascending: true })
        .limit(6)
      return (data ?? []) as Event[]
    },
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse">
        <div className="flex gap-4 mb-8">
          <div className="w-20 h-20 rounded-full bg-[#E5E7EB]" />
          <div className="flex-1 space-y-3 py-1">
            <div className="h-5 bg-[#E5E7EB] rounded w-1/3" />
            <div className="h-4 bg-[#E5E7EB] rounded w-1/4" />
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-[#6B7280]">Không tìm thấy người dùng.</div>
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 mb-6 flex items-start gap-4">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.display_name} className="w-20 h-20 rounded-full object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-[#E8F3FF] flex items-center justify-center text-[#0052CC] font-bold text-2xl">
            {profile.display_name[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[#1F2937]">{profile.display_name}</h1>
          {profile.skill_level && <div className="mt-1.5"><SkillLevelBadge level={profile.skill_level} /></div>}
          {profile.bio && <p className="mt-3 text-sm text-[#6B7280] leading-relaxed">{profile.bio}</p>}
        </div>
      </div>

      {hostedEvents && hostedEvents.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-[#1F2937] mb-4">Vãng Lai Đang Tổ Chức</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {hostedEvents.map(event => <EventCard key={event.id} event={event} />)}
          </div>
        </div>
      )}
    </div>
  )
}
