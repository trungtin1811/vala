'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import type { Court } from '@/types'

export function useCourts() {
  const { user } = useAuth()

  return useQuery<Court[]>({
    queryKey: ['courts', user?.id],
    queryFn: () => apiFetch<Court[]>('/api/courts'),
    enabled: !!user,
  })
}

export function useCreateCourt() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: { name: string; address?: string | null; latitude?: number | null; longitude?: number | null }) =>
      apiFetch<Court>('/api/courts', {
        method: 'POST',
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courts', user?.id] })
    },
  })
}
