import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { getErrorMessage, useToast } from '@/context/ToastContext'
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
      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      else params.set('activeOnly', '1')
      if (filters.location) params.set('location', filters.location)
      if (filters.date) params.set('date', filters.date)
      return apiFetch<Event[]>(`/api/events?${params.toString()}`)
    },
  })
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: () => apiFetch<Event>(`/api/events/${id}`),
    enabled: !!id,
  })
}

export function useMyEvents(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-events', userId],
    queryFn: () => apiFetch<Event[]>('/api/events?mine=1&order=desc'),
    enabled: !!userId,
  })
}

export function useDeleteEvent() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/api/events/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] })
      toast.success('Đã xoá vãng lai.')
    },
    onError: error => toast.error(getErrorMessage(error, 'Không thể xoá vãng lai.')),
  })
}
