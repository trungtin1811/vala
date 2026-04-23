import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Event, EventStatus, SkillLevel } from '@/types'

interface EventFilters {
  location?: string
  date?: string
  skill_level?: SkillLevel
  status?: EventStatus
}

export function useEvents(filters: EventFilters = {}) {
  return useQuery({
    queryKey: ['events', filters],
    queryFn: async () => {
      let query = supabase
        .from('events')
        .select(`*, host:users(*), skill_requirements:event_skill_requirements(*)`)
        .order('event_date', { ascending: true })
        .order('event_time', { ascending: true })

      if (filters.status) query = query.eq('status', filters.status)
      else query = query.in('status', ['active', 'closed'])

      if (filters.location) query = query.ilike('location', `%${filters.location}%`)
      if (filters.date) query = query.eq('event_date', filters.date)

      const { data, error } = await query
      if (error) throw error
      return data as Event[]
    },
  })
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(`*, host:users(*), skill_requirements:event_skill_requirements(*)`)
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Event
    },
    enabled: !!id,
  })
}

export function useMyEvents(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-events', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(`*, skill_requirements:event_skill_requirements(*)`)
        .eq('host_id', userId!)
        .order('event_date', { ascending: false })
      if (error) throw error
      return data as Event[]
    },
    enabled: !!userId,
  })
}

export function useDeleteEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('events').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  })
}
