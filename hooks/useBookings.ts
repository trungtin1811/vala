import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Booking, SkillLevel } from '@/types'

export function useEventBookings(eventId: string) {
  return useQuery({
    queryKey: ['bookings', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, member:users(*)')
        .eq('event_id', eventId)
        .eq('status', 'booked')
        .order('booked_at', { ascending: true })
      if (error) throw error
      return data as Booking[]
    },
    enabled: !!eventId,
  })
}

export function useMyBookings(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-bookings', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, event:events(*, host:users(*), skill_requirements:event_skill_requirements(*))')
        .eq('member_id', userId!)
        .eq('status', 'booked')
        .order('booked_at', { ascending: false })
      if (error) throw error
      return data as Booking[]
    },
    enabled: !!userId,
  })
}

export function useBook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ eventId, memberId, skillLevel }: { eventId: string; memberId: string; skillLevel: SkillLevel }) => {
      const { error: bookingError } = await supabase.from('bookings').insert({
        event_id: eventId,
        member_id: memberId,
        skill_level: skillLevel,
        status: 'booked',
      })
      if (bookingError) throw bookingError

      const { error: slotError } = await supabase.rpc('increment_slots_booked', {
        p_event_id: eventId,
        p_skill_level: skillLevel,
      })
      if (slotError) throw slotError
    },
    onSuccess: (_, { eventId }) => {
      qc.invalidateQueries({ queryKey: ['event', eventId] })
      qc.invalidateQueries({ queryKey: ['bookings', eventId] })
      qc.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

export function useCancelBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ bookingId, eventId, skillLevel }: { bookingId: string; eventId: string; skillLevel: SkillLevel }) => {
      const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId)
      if (error) throw error

      await supabase.rpc('decrement_slots_booked', {
        p_event_id: eventId,
        p_skill_level: skillLevel,
      })
    },
    onSuccess: (_, { eventId }) => {
      qc.invalidateQueries({ queryKey: ['event', eventId] })
      qc.invalidateQueries({ queryKey: ['bookings', eventId] })
      qc.invalidateQueries({ queryKey: ['my-bookings'] })
    },
  })
}
